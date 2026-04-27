# Auth, Security, and Supabase

기준일:
- 2026-04-18

## 인증 방식

요구사항 반영:
- ID/비밀번호 로그인 필요
- OTP 필요
- Google 이메일 연동 필요

현재 구현 결정:
- 화면에서는 `ID / PW` 로그인을 제공
- 내부 인증은 `Supabase Auth`의 이메일/비밀번호를 사용
- `manager.username -> email` 조회 후 `signInWithPassword`로 로그인
- 계정이 하나도 없으면 `/setup/initial-admin` 초기 설정 페이지를 먼저 노출
- 초기 설정 페이지에서 최초 관리자 계정을 생성

권장 구현:
- 1차 인증: `Supabase Auth`의 이메일/비밀번호
- 2차 인증: `TOTP MFA`
- 소셜 로그인: `Google OAuth`

근거:
- Supabase Auth는 비밀번호, OTP, 소셜 로그인, MFA를 공식 지원한다.

공식 문서:
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Supabase MFA TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp)
- [Supabase Google Login](https://supabase.com/docs/guides/auth/social-login/auth-google)

## 비밀번호 보안

정리:
- 비밀번호는 복호화 가능한 암호화가 아니라, 단방향 해시 저장이 원칙이다.
- 최신 권장 알고리즘은 `Argon2id`다.

중요:
- 사용자가 직접 비밀번호 저장 로직을 구현하는 구조라면 Argon2id 적용을 기본 원칙으로 한다.
- 하지만 Supabase Auth를 사용할 경우, 실제 비밀번호 저장 처리는 Supabase Auth 관리 영역에 위임되므로 애플리케이션 레벨에서 별도 해시 저장 로직을 중복 구현하지 않는 방향이 기본이다.

공식 문서:
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## 보안 원칙

- 세션 검증은 서버에서 우선 수행
- 보호 라우트는 서버 레이아웃 또는 서버 유틸에서 가드
- 민감 정보는 서버 전용 환경변수로 유지
- 브라우저 노출 값만 `NEXT_PUBLIC_` 접두사 사용
- Supabase DB는 RLS(Row Level Security) 전제를 둔다

## Supabase 권장 구조

```text
src/lib/supabase/
  client.ts
  server.ts
  middleware.ts
```

권장 역할:
- `client.ts`: 브라우저 클라이언트
- `server.ts`: 서버 컴포넌트/서버 액션/라우트 핸들러용
- `middleware.ts` 또는 최신 Next.js 구조에 맞는 요청 레벨 세션 처리 유틸

현재 추가 유틸:
- `admin.ts`: `SUPABASE_SERVICE_ROLE_KEY` 기반 관리자 작업용
- `manager.ts`: `manager` 프로필 조회, ID->email 조회, 초기 설정 필요 여부 판단

## 로컬 개발 전략

권장:
- Supabase CLI로 로컬 스택 실행
- 로컬 DB, Auth, Studio를 함께 사용

이유:
- 개발용 임시 모듈을 따로 찾기보다, Supabase가 제공하는 로컬 개발 스택이 템플릿 목적에 더 적합하다.

기본 흐름:

```bash
npx supabase init
npx supabase start
```

참고:
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)

## 환경변수 파일 정책

중요 수정:
- Next.js 공식 환경명은 `.env.develop`가 아니라 `.env.development`다.

권장 파일:
- `.env`
- `.env.local`
- `.env.development`
- `.env.development.local`
- `.env.production`
- `.env.production.local`
- `.env.test`

주의:
- 대부분의 `.env*` 파일은 커밋하지 않는다.
- 공유 가능한 샘플은 `.env.example`로 관리한다.

환경변수 로드 순서:
1. `process.env`
2. `.env.$(NODE_ENV).local`
3. `.env.local`
4. `.env.$(NODE_ENV)`
5. `.env`

참고:
- `NODE_ENV` 허용값은 `development`, `production`, `test`

공식 문서:
- [Next.js Environment Variables](https://nextjs.org/docs/pages/guides/environment-variables)

## 템플릿 기본 환경변수 초안

```env
NEXT_PUBLIC_APP_NAME=
NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

비고:
- 실제 OAuth 설정 시 Supabase 대시보드와 로컬 `supabase/config.toml` 값도 함께 맞춰야 한다.
- `SERVICE_ROLE` 키는 서버 전용이다.
- 현재 프로젝트에서는 브라우저/SSR 공개 키를 `SUPABASE_API_KEY`로도 읽도록 구성했다.
- 회원 탈퇴처럼 Auth 사용자를 실제 삭제하는 기능에는 `SUPABASE_SERVICE_ROLE_KEY`가 필요하다.

## 인증 UI 초안

권장 페이지:
- `/sign-in`
- `/sign-up`
- `/setup/initial-admin`
- `/[locale]/forgot-password`
- `/[locale]/verify-mfa`
- `/[locale]/settings/security`

권장 사용자 흐름:
1. 계정이 없으면 `/setup/initial-admin`에서 최초 관리자 생성
2. 일반 사용자는 회원 가입 페이지에서 Supabase Auth 계정 생성
3. 로그인 시 `ID` 또는 `E-mail` 입력
4. `ID` 입력이면 `manager.username` 기준으로 이메일을 조회
5. Supabase Auth 세션 생성 후 보호 영역 진입
6. 필요 시 MFA/TOTP를 후속 단계로 확장

실무 메모:
- 테스트 중 `Email signups are disabled` 상태에서는 회원 가입이 실패했다.
- Supabase 설정에서 Email provider 활성화가 필요하다.
- `example.com` 계열 테스트 주소는 프로젝트 설정에 따라 `email_address_invalid`로 거부될 수 있었다.

## 추후 결정 항목

- MFA를 선택 기능으로 둘지, 관리자 계정에만 강제할지
- Google OAuth를 로그인 전용으로 둘지, 계정 연결 기능까지 포함할지
- 비밀번호 정책의 길이/문자 조합/만료 정책
