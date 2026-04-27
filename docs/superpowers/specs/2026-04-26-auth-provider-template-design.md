# 인증 Provider 템플릿 설계

## 요약

`kmsf`는 `local-json`을 테스트 전용 fallback이 아니라 정식 starter 인증 provider로 취급한다. Supabase는 특히 Google OAuth가 필요한 경우 기본 권장 managed auth 경로로 유지한다. 다만 KMSF 사용자가 직접 확인, 교체, 커스터마이징할 수 있는 단순 ID/PW 모듈이 필요하면 `local-json`을 선택할 수 있다.

## 목표

- `local-json`을 개발/테스트 전용이 아니라 명시적인 인증 provider 옵션으로 승격한다.
- provider 선택은 `KMSF_AUTH_PROVIDER`로 제어한다.
- 별도 override가 없으면 Supabase를 기본 provider로 유지한다.
- secret은 문서와 소스 파일에 포함하지 않는다.
- Supabase Google OAuth 설정을 위한 간단한 인증 가이드를 추가한다.
- 실제 런타임 DB가 아니라 사용자가 복사할 수 있는 local JSON DB 예시를 추가한다.
- 기존 local-json password hashing과 session 동작은 유지한다.
- 사용자가 local-json을 완전한 managed auth 제품으로 오해하지 않도록 한계를 명확히 문서화한다.

## 비목표

- local-json을 완전한 enterprise auth 시스템으로 만들지 않는다.
- 이번 변경에서 local-json에 비밀번호 재설정, 이메일 인증, 계정 잠금 정책, 감사 로그, MFA를 추가하지 않는다.
- 실제 OAuth credential, Supabase key, local user password, runtime DB 파일을 커밋하지 않는다.
- Supabase Google OAuth 지원을 제거하지 않는다.

## Provider 정책

Provider 선택 규칙:

- `KMSF_AUTH_PROVIDER=local-json` -> local JSON 인증 provider를 사용한다.
- 미설정 또는 그 외 값 -> Supabase 인증 provider를 사용한다.

이 규칙에 따라 사용자가 명시적으로 선택하면 production 환경에서도 `local-json`을 실행할 수 있다. 문서에는 `local-json`이 starter/template provider이며, 운영 환경에서 사용하려면 보안 요구사항을 별도로 검토해야 한다는 점을 명확히 적는다.

## Local JSON 인증 템플릿

런타임 DB 경로는 유지한다.

```text
apps/kmsf/.local/auth.db.json
```

이 파일은 계속 git ignore 대상이다.

템플릿/예시 파일 경로:

```text
templates/next-app-auth/.local/auth.db.example.json
```

예시 파일에는 재사용 가능한 실제 비밀번호를 넣지 않는다. `accounts` 배열은 비워두거나, placeholder hash 필드를 명확히 표시해야 한다. 권장 기본값:

```json
{
  "version": 1,
  "accounts": []
}
```

가이드에서는 기본적으로 앱의 회원가입 화면을 통해 계정을 생성하도록 안내한다. 수동 seed가 필요한 경우에만 예시 파일을 `.local/auth.db.json`으로 복사하도록 설명한다.

## Supabase Google OAuth 가이드

간단한 가이드를 아래 경로에 추가한다.

```text
docs/auth-guide.md
```

가이드에 포함할 내용:

- provider 옵션: Supabase, local-json
- 필요한 `.env` 값
- Google Cloud Console OAuth client 생성
- Supabase Google provider 설정
- local redirect URL
- secret 저장 위치
- 커밋하면 안 되는 항목

`README.md`는 이 가이드로 연결한다.

## 환경 변수

실제 secret 없이 아래 값을 문서화한다.

```env
KMSF_AUTH_PROVIDER=supabase
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

local JSON용 값:

```env
KMSF_AUTH_PROVIDER=local-json
KMSF_LOCAL_AUTH_DB_PATH=
KMSF_LOCAL_AUTH_SESSION_SECRET=
```

production과 유사한 배포 환경에서는 재시작 후에도 local session signature가 안정적으로 유지되도록 `KMSF_LOCAL_AUTH_SESSION_SECRET` 설정을 권장한다.

## 테스트 전략

TDD 변경:

- 명시적으로 선택한 경우 production에서도 `local-json`이 허용됨을 provider selection test로 증명한다.
- Supabase가 기본값으로 유지됨을 검증하는 테스트를 유지한다.
- local-json auth store 테스트를 유지한다.
- local-json e2e 회원가입/로그인/settings/삭제 flow를 유지한다.

검증:

- `npm run lint`
- `npm run test:run`
- `npm run build`
- `KMSF_AUTH_PROVIDER=local-json npm --workspace=apps/kmsf run test:e2e -- tests/e2e/local-json-auth.spec.ts`

## 리스크

- 사용자가 local-json을 완전한 production auth solution으로 오해할 수 있다. 대응: 한계를 명확히 문서화한다.
- local-json provider가 조건부 auth path에서 server file I/O를 사용하므로 Turbopack NFT warning이 남아 있다. 대응: warning을 기록하고, warning 없는 production build가 필요해지면 provider split을 후속 검토한다.
