# KMSF 인증 가이드

이 문서는 KMSF 인증 provider 설정 방법을 정리한다.

인증 키, OAuth secret, Supabase service role key는 절대 커밋하지 않는다. 모든 민감 값은 `.env.local`, `.env.production.local`, 배포 플랫폼의 Secret/Environment Variables에 저장한다.

## 인증 Provider 선택

KMSF는 현재 두 가지 인증 provider를 제공한다.

| 인증 Provider | 용도 | 선택 값 |
| --- | --- | --- |
| Supabase | 기본 권장 인증. E-mail/PW, Google OAuth, Supabase Auth 세션 사용 | unset 또는 `KMSF_AUTH_PROVIDER=supabase` |
| local-json | 커스터마이징 가능한 ID/PW starter provider. `lowdb` 기반 로컬 JSON DB에 계정 저장 | `KMSF_AUTH_PROVIDER=local-json` |

Supabase가 기본값이다. 다만 런타임에서 Supabase 환경 변수 또는 Auth health check를 확인할 수 없으면 `local-json`으로 fallback한다.

## 공통 환경 변수

`apps/kmsf/.env.local` 예시:

```env
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
KMSF_AUTH_PROVIDER=supabase
```

## Supabase + Google OAuth 설정

### 1. Google Cloud OAuth Client 생성

Google Cloud Console에서 현재 프로젝트를 선택한 뒤 아래 순서로 진행한다.

1. `API 및 서비스` -> `OAuth 동의 화면`
2. 앱 이름, 사용자 지원 이메일, 개발자 연락처를 입력한다.
3. 테스트 중이면 테스트 사용자에 본인 Google 계정을 추가한다.
4. `API 및 서비스` -> `사용자 인증 정보`
5. `사용자 인증 정보 만들기` -> `OAuth 클라이언트 ID`
6. 애플리케이션 유형은 `웹 애플리케이션`을 선택한다.
7. 승인된 JavaScript 원본을 추가한다.

```text
http://127.0.0.1:3000
http://localhost:3000
```

8. 승인된 리디렉션 URI에 Supabase callback URL을 추가한다.

```text
https://<supabase-project-ref>.supabase.co/auth/v1/callback
```

Google Cloud에서 생성된 `클라이언트 ID`와 `클라이언트 보안 비밀번호`는 Supabase에만 입력한다. 저장소에는 기록하지 않는다.

### 2. Supabase Google Provider 활성화

Supabase Dashboard에서:

1. `Authentication` -> `Sign In / Providers`
2. `Google` 선택
3. Enable
4. Google Cloud에서 발급받은 Client ID와 Client Secret 입력
5. 저장

### 3. Supabase URL 설정

Supabase Dashboard에서 `Authentication` -> `URL Configuration`으로 이동한다.

권장 로컬 설정:

```text
Site URL:
http://127.0.0.1:3000

Redirect URLs:
http://127.0.0.1:3000/auth/callback
http://localhost:3000/auth/callback
```

### 4. Supabase 환경 변수

`apps/kmsf/.env.local`:

```env
KMSF_AUTH_PROVIDER=supabase
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_API_KEY=
SUPABASE_SECRET_KEY=
```

주의:

- `SUPABASE_SECRET_KEY`는 서버 전용이다.
- 브라우저에서 접근 가능한 값만 `NEXT_PUBLIC_` 접두사를 사용한다.
- Google Client Secret은 Supabase Dashboard에 저장하고 앱 `.env`에는 넣지 않는다.

## local-json ID/PW 인증 Provider 설정

`local-json` provider는 KMSF 사용자가 직접 인증 모듈을 이해하고 커스터마이징할 수 있도록 제공되는 starter provider다. 기본 로컬 DB 모듈은 npm 패키지 `lowdb`이며, 현재 요구 범위에서는 `better-sqlite3` 같은 SQLite 네이티브 의존성을 추가하지 않는다.

환경 변수:

```env
KMSF_AUTH_PROVIDER=local-json
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
KMSF_LOCAL_AUTH_DB_PATH=
KMSF_LOCAL_AUTH_SESSION_SECRET=
```

기본 DB 경로:

```text
apps/kmsf/.local/auth.db.json
```

이 파일은 `.gitignore` 대상이다. 런타임 계정 데이터와 password hash가 들어갈 수 있으므로 커밋하지 않는다.

예시 파일:

```text
templates/next-app-auth/.local/auth.db.example.json
```

필요하면 아래처럼 복사해서 시작할 수 있다.

```bash
mkdir -p apps/kmsf/.local
cp templates/next-app-auth/.local/auth.db.example.json apps/kmsf/.local/auth.db.json
```

일반적으로는 앱의 회원가입 화면을 통해 계정을 생성하는 방식을 권장한다.

### local-json 보안 범위

기본 구현은 다음을 제공한다.

- ID 또는 E-mail 기반 로그인
- Node.js `scrypt` 기반 단방향 password hash
- local session cookie 서명
- 계정 생성/수정/삭제

비밀번호는 복호화 가능한 AES 방식으로 저장하지 않는다. 관리자 비밀번호는 화면에 다시 채우지 않고, 수정 시 새 비밀번호가 입력된 경우에만 기존 password hash를 새 hash로 덮어쓴다.

기본 구현에 포함되지 않는 항목:

- 비밀번호 재설정
- 이메일 인증
- 계정 잠금 정책
- 관리자 감사 로그
- MFA
- 외부 OAuth 연결
- ODBC 또는 설치형 서버 DB 어댑터

운영 서비스에서 local-json을 사용할 경우 위 항목을 프로젝트 요구사항에 맞게 확장해야 한다. 완전한 managed auth가 필요하면 Supabase provider를 우선 권장한다.

## 검증 명령

```bash
npm run lint
npm run test:run
npm run build
KMSF_AUTH_PROVIDER=local-json npm --workspace=apps/kmsf run test:e2e -- tests/e2e/local-json-auth.spec.ts
```
