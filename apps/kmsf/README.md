# KMSF App

`apps/kmsf`는 KMSF 저장소의 메인 Next.js App Router 애플리케이션이다. 개발자가 프로젝트 레이아웃, DB, 인증, 설정 저장, 메뉴 구성을 선택해 시작할 수 있도록 초기 설정 흐름을 제공한다.

## 실행

루트에서 실행:

```bash
npm run dev
```

앱 workspace를 직접 지정해 실행:

```bash
npm --workspace=apps/kmsf run dev
```

E2E용 고정 host/port dev server:

```bash
npm --workspace=apps/kmsf run dev:e2e
```

## 초기 설정 흐름

초기 설정은 `/setup/initial-admin`에서 진행된다. 설정이 없거나 인증 provider 기준으로 초기 admin이 없으면 초기 설정이 필요하다고 판단한다.

현재 단계:

1. Welcome
2. GNB layout
3. DB 선택
4. 인증 선택
5. 애플리케이션 설정 저장 방식 선택
6. 메뉴 구성 방식 선택
7. 필요한 경우 초기 admin 생성
8. 완료 화면 또는 `/` route 분기

## 설정 옵션

### GNB Layout

지원 영역:

- `top`
- `left`
- `right`
- `footer`

초기 기본값은 `top`, `left`다. 아무 영역도 선택하지 않으면 설정 완료 후 KMSF App welcome page만 표시하는 방향으로 동작한다.

운영 중 GNB 설정은 설정 화면에서 계정별 localStorage key로 저장된다. 모바일에서는 필수 영역을 유지하고 desktop 표시/숨김을 중심으로 동작한다.

### DB Mode

지원 mode:

- `none`: KMSF가 DB를 관리하지 않는다.
- `dev-local-db`: 개발 모드용 file-backed local DB 흐름이다.
- `sqlite`: 개발/운영 모두를 고려한 sqlite3 기반 local DB 후보이다.
- `external-adapter`: 외부 DB adapter 연결을 위한 확장 후보이다.
- `supabase`: Supabase Auth/DB 연동 mode다.

### Auth Mode

지원 mode:

- `manual`: KMSF 인증 기능을 사용하지 않고 개발자가 직접 구현한다.
- `kmsf-managed`: 선택된 local DB 계열을 사용해 KMSF가 계정을 관리한다.
- `supabase`: Supabase Auth를 사용한다.

`manual` 선택 시 초기 admin 생성과 로그인 화면은 생략될 수 있다. 인증이 필요한 mode에서는 초기 admin 계정을 생성한 뒤 로그인 흐름으로 이동한다.

### App Config Storage

지원 mode:

- `manual`
- `local-storage`
- `connected-db`

`local-storage`는 서버에서 그려야 하는 상태의 원천으로 사용하지 않는다. 사용자가 이 mode를 선택할 때는 브라우저 저장소 기반이라는 점을 인지해야 한다.

### Menu Source

지원 mode:

- `manual`
- `app-routes`
- `settings-ui`

`app-routes`는 실제 page route를 기준으로 메뉴 후보를 생성한다. API, setup, auth, locale duplicate route는 메뉴 후보에서 제외한다.

## 인증과 계정

- 초기 admin 기본 ID는 `admin`이다.
- admin 생성 시 이메일, 비밀번호, 비밀번호 확인을 입력한다.
- level/role 기반 접근 제어를 제공한다.
- 설정 페이지의 계정 관리는 level 3 관리자에게만 노출된다.
- Supabase mode에서는 manager profile, 최근 로그인 시간, 계정 상태, Google OAuth 연결 상태를 함께 다룬다.

## 설정 페이지

설정 페이지는 현재 다음 section을 제공한다.

- 시스템 정보
- 계정 관리
- GNB 설정
- 시스템 초기화

시스템 초기화는 level 3 관리자 권한과 비밀번호 재입력을 요구한다. Factory reset은 계정, 설정 상태, 세션, provider 상태를 초기화하고 초기 설정 화면을 다시 열 수 있도록 한다.

## Supabase 환경 변수

Supabase를 사용할 때 필요한 변수:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_API_KEY=your_supabase_publishable_or_anon_key
SUPABASE_SECRET_KEY=<server-only-value>
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
```

`SUPABASE_SECRET_KEY`는 서버 전용이다. 클라이언트 컴포넌트, 브라우저 로그, 공개 문서에 실제 값을 노출하지 않는다.

## 검증

앱 baseline:

```bash
npm --workspace=apps/kmsf run lint
npm --workspace=apps/kmsf run test:run
npm --workspace=apps/kmsf run build
npm --workspace=apps/kmsf run verify
```

브라우저 포함 full gate:

```bash
npm --workspace=apps/kmsf run verify:full
```

Local auth E2E:

```bash
npm --workspace=apps/kmsf run test:e2e:local
```

Remote Supabase E2E:

```bash
npm --workspace=apps/kmsf run test:e2e:supabase
```

Supabase 초기 설정 포함 E2E:

```bash
npm --workspace=apps/kmsf run test:e2e:supabase:initial
```

## 작업 지침

- 앱 작업 전 [AGENTS.md](AGENTS.md)를 확인한다.
- 소스 변경은 [src/AGENTS.md](src/AGENTS.md)를 따른다.
- 테스트와 브라우저 검증은 [tests/AGENTS.md](tests/AGENTS.md)를 따른다.
