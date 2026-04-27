# 인증 Provider 확장 설계

## 요약

`kmsf`는 Supabase Auth를 운영 환경의 기본 source of truth로 유지하면서, 개발/테스트에서 결정적으로 계정 CRUD와 로그인을 검증할 수 있도록 local JSON 인증 provider를 추가한다.

이 문서는 최초 설계 당시 기준으로 작성되었다. 이후 2026-04-26 설계에서 `local-json`은 테스트 전용이 아니라 명시적으로 선택 가능한 starter provider로 승격되었다. 현재 정책은 `docs/superpowers/specs/2026-04-26-auth-provider-template-design.md`를 우선한다.

## 목표

- 운영용 E-mail/PW와 Google OAuth는 Supabase Auth 기반으로 유지한다.
- Supabase 기반 flow에서 Google OAuth 로그인, profile sync, account removal을 지원한다.
- 개발/테스트용 local ID/PW 계정 생성, 삭제, 로그인을 추가한다.
- local 계정은 `apps/kmsf/.local/auth.db.json`에 저장한다.
- 신규 runtime dependency는 표준 라이브러리만으로 부족하다는 근거가 있을 때만 추가한다.
- TDD와 후속 커스터마이징이 가능하도록 auth provider 경계를 명확히 만든다.

## 비목표

- Supabase Auth를 운영 기본 인증에서 제거하지 않는다.
- local 개발 비밀번호를 평문으로 저장하지 않는다.
- 이 단계에서 local JSON provider를 production-grade auth로 완성하지 않는다.
- local provider를 위해 별도 DB service를 도입하지 않는다.
- 현재 role model인 `admin`, `member` 범위를 변경하지 않는다.

## 현재 상태

- password sign-in은 `manager.username -> email -> supabase.auth.signInWithPassword` 경로를 사용한다.
- Google OAuth sign-in은 `signInWithGoogleAction`에서 시작한다.
- `/auth/callback`은 OAuth code를 교환하고, `manager`를 sync한 뒤 app session cookie를 touch한다.
- `getCurrentUser()`는 Supabase session을 읽고 `authMode`를 `google`, `password`, `supabase`로 산출한다.
- Settings 화면은 현재 auth mode를 표시하지만, 당시에는 연결된 Google identity 상태 관리는 없었다.

## Provider 모델

`apps/kmsf/src/lib/auth/providers` 아래에 좁은 provider contract를 둔다.

```ts
export type AuthProviderKind = "supabase" | "local-json";

export type AuthAccountInput = {
  username: string;
  email: string;
  password: string;
  role: "admin" | "member";
};

export type AuthSessionUser = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "member";
  authMode: "password" | "google" | "local-json" | "supabase";
};
```

운영 provider는 기존 Supabase action path를 감싼다. local provider는 file-backed storage로 같은 계정 수준 동작을 구현한다.

초기 설계의 provider 선택 기준:

- production: 항상 `supabase`
- development/test + `KMSF_AUTH_PROVIDER=local-json`: local JSON provider
- development/test + override 없음: 기존 Supabase 동작

현재 적용 기준:

- `KMSF_AUTH_PROVIDER=local-json`: 모든 환경에서 local JSON provider
- 미설정 또는 그 외 값: Supabase provider

## Supabase Provider

Supabase는 아래 책임을 유지한다.

- E-mail/PW 계정 생성
- `manager.username -> email` 매핑을 통한 ID/PW 로그인
- Google OAuth 로그인
- OAuth callback session exchange
- `manager` profile sync
- Supabase Auth와 `manager` 계정 삭제

Google 계정 추가/삭제는 settings의 account linking 관리로 모델링한다. 설치된 Supabase client API에서 identity linking을 지원하지 않으면 첫 구현은 Google sign-in과 계정 삭제까지만 제한하고, linking은 follow-up으로 기록한다.

## Local JSON Provider

local provider는 아래 파일에 record를 저장한다.

```text
apps/kmsf/.local/auth.db.json
```

이 파일은 git ignore 대상이어야 한다. 커밋 가능한 예시 파일이 필요하면 실제 런타임 DB와 분리한다.

권장 저장 형태:

```json
{
  "version": 1,
  "accounts": [
    {
      "id": "local_...",
      "username": "admin",
      "email": "admin@local.test",
      "role": "admin",
      "passwordHash": "...",
      "passwordSalt": "...",
      "createdAt": "2026-04-25T00:00:00.000Z",
      "updatedAt": "2026-04-25T00:00:00.000Z"
    }
  ]
}
```

비밀번호 hash는 Node 표준 라이브러리 `crypto`의 `scrypt`와 계정별 random salt를 사용한다. 구현은 평문 비밀번호를 절대 저장하지 않는다.

local provider 동작:

- `createAccount(input)`: username/email unique 여부를 검증하고, password hash 후 record를 추가한다.
- `deleteAccount(id)`: record를 삭제하고 local app session을 무효화한다.
- `verifyPassword(identifier, password)`: username 또는 email 로그인을 허용한다.
- `getUser(id)`: password field 없이 session-safe user object를 반환한다.

File I/O는 server-only로 유지한다. Client component와 browser bundle은 local store를 import하면 안 된다.

## Session 전략

Supabase session은 Supabase SSR의 cookie 기반 session을 유지한다.

Local JSON session은 별도의 server-owned app session cookie를 사용한다. Cookie payload에는 아래처럼 민감하지 않은 식별자만 포함한다.

```json
{
  "provider": "local-json",
  "userId": "local_..."
}
```

구현은 password hash, client input 기반 role, mutable profile data를 client-controlled session 값에 직접 넣지 않는다. 보호된 요청마다 JSON store에서 local user를 resolve하고, role/display data는 server-side에서 산출한다.

## UI 범위

초기 구현은 넓은 UI redesign을 피한다.

필수 UI 동작:

- 기존 sign-in form은 ID/PW 입력을 계속 받는다.
- `KMSF_AUTH_PROVIDER=local-json`이면 sign-in은 local JSON provider로 인증한다.
- sign-up은 local-json mode에서 local account를 생성할 수 있다.
- Supabase가 설정되지 않은 경우 Google OAuth button은 비활성 상태를 유지한다.
- Settings는 local session의 `local-json` auth mode를 명확히 표시한다.

Local JSON의 계정 추가/삭제는 별도 account management 화면을 만들기 전에 기존 sign-up과 account deletion flow를 통해 구현한다.

## 오류 처리

- local credential이 잘못된 경우 기존 auth failure state를 재사용한다.
- username/email 중복은 현재 field-level duplicate error를 재사용한다.
- local file read/write 실패는 UI에서는 auth failure로 응답하고 server-side detail은 로그로 남긴다.
- 초기 설계에서는 production의 `local-json` 시도를 Supabase로 fail closed한다고 보았지만, 현재 정책에서는 명시 선택 시 허용한다.

## 테스트 전략

구현에는 TDD를 적용한다.

Focused test:

- local auth store가 password를 hash하여 계정을 생성한다.
- local auth store가 duplicate username/email을 거부한다.
- local auth store가 username/password와 email/password를 검증한다.
- local auth store가 잘못된 password를 거부한다.
- local auth store가 계정을 삭제한다.
- provider selection은 현재 정책상 명시 선택된 `local-json`을 허용한다.

Integration test:

- `KMSF_AUTH_PROVIDER=local-json`일 때 sign-in action이 local provider를 사용한다.
- local-json mode에서 sign-up action이 local account를 생성한다.
- local-json mode에서 account deletion이 local record를 삭제한다.
- 기존 Supabase password와 Google action은 현재 테스트 범위에서 회귀하지 않는다.

E2E 후보:

- local-json sign-up -> dashboard -> settings auth mode -> delete account
- 기존 auth validation i18n test 유지

기본 검증:

- `npm run lint`
- `npm run test:run`
- `npm run build`
- rendered auth flow가 바뀌면 `npm run test:e2e` 또는 browser verification

## Rollout 단계

1. Provider contract와 provider selection test를 추가한다.
2. Local auth store test를 생성/삭제/검증 중심으로 추가한다.
3. Server-only file I/O와 password hashing으로 local auth store를 구현한다.
4. 기존 sign-in/sign-up server action을 최소 수정으로 provider selection에 연결한다.
5. Local session read/write를 추가하고 `getCurrentUser()`를 조정한다.
6. local-json mode의 account deletion을 확장한다.
7. Settings label과 i18n에 `local-json`을 추가한다.
8. 자동화 검증과 browser/e2e 검증을 실행한다.
9. `test-reports/YYYY-MM-DD.md`를 업데이트한다.

## 후속 검토

- Google account linking/unlinking을 Supabase identity linking으로 첫 구현에 포함할지, settings/security 후속 개선으로 분리할지 결정한다.
- 커밋 가능한 local auth example fixture 제공 여부를 결정한다.
- local-json mode를 `.env.test` 전용으로 둘지, `.env.development.local`에서도 허용할지 결정한다.
