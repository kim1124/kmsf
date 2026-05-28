# KMSF 워크스페이스

`kmsf`는 `create-kmsf` 형태의 보일러플레이트와 재사용 패키지를 함께 관리하는 `npm workspaces` 저장소로 구성된다.

## 현재 구조

```text
kmsf/
├── apps/
│   └── kmsf/                 # 현재 메인 Next.js 16 App Router 앱
├── examples/
│   └── basic-dashboard/      # 패키지 소비 검증용 예제 앱
├── packages/
│   ├── create-kmsf/           # KMSF scaffold CLI
│   ├── generator-core/        # 생성 로직 패키지
│   ├── charts/                # package name: @kmsf/charts
│   ├── data-table/            # package name: @kmsf/data-table
│   └── gridstack/             # package name: @kmsf/gridstack
├── templates/
│   ├── next-app-base/         # create-kmsf 기본 Next.js 템플릿 원본
│   ├── next-app-auth/         # auth 관련 참고/후속 템플릿 후보
│   ├── next-monorepo/         # monorepo 템플릿 후보
│   └── backend-base/          # backend 템플릿 후보
├── docs/
├── reports/                   # 루트 작업 보고서
├── .agents/skills/
└── package.json               # root workspace orchestration
```

`@kmsf/charts` 같은 이름은 디렉터리명이 아니라 `package.json`의 package name에 두는 편이 일반적인 구성에 더 가깝다. 따라서 실제 디렉터리는 `packages/charts`처럼 두고, 패키지명은 `@kmsf/charts`로 유지한다.

## 실행 규칙

- 저장소 공통 계약: [AGENTS.md](<repo-root>/AGENTS.md)
- 메인 앱 계약: [apps/kmsf/AGENTS.md](<repo-root>/apps/kmsf/AGENTS.md)
- 메인 앱 소스 규칙: [apps/kmsf/src/AGENTS.md](<repo-root>/apps/kmsf/src/AGENTS.md)
- 메인 앱 테스트 규칙: [apps/kmsf/tests/AGENTS.md](<repo-root>/apps/kmsf/tests/AGENTS.md)
- 패키지 소비 예제 계약: [examples/basic-dashboard/AGENTS.md](<repo-root>/examples/basic-dashboard/AGENTS.md)
- 저장소 전용 skill: [.agents/skills/delivery/SKILL.md](<repo-root>/.agents/skills/delivery/SKILL.md)

## 워크스페이스

### 메인 앱

- 경로: `apps/kmsf`
- package name: `@kmsf/app-kmsf`
- 기술 스택: Next.js 16, React 19, Tailwind CSS 4, next-intl, Supabase Auth

### 예제 앱

- 경로: `examples/basic-dashboard`
- package name: `@kmsf/example-basic-dashboard`
- 역할: `@kmsf/charts`, `@kmsf/data-table`, `@kmsf/gridstack` 소비 검증용

### 재사용 패키지

- `packages/create-kmsf` -> `create-kmsf`
- `packages/generator-core` -> `@kmsf/generator-core`
- `packages/charts` -> `@kmsf/charts`
- `packages/data-table` -> `@kmsf/data-table`
- `packages/gridstack` -> `@kmsf/gridstack`

### 템플릿

- `templates/next-app-base`: `apps/kmsf`에서 동기화되는 기본 scaffold 원본
- `templates/next-app-auth`: auth 관련 참고/후속 템플릿 후보
- `templates/next-monorepo`: monorepo 템플릿 후보
- `templates/backend-base`: backend 템플릿 후보

현재 `create-kmsf` catalog는 `next-app-base`만 사용한다. 나머지 템플릿 후보는 실제 catalog에 추가되기 전까지 production scaffold 경로가 아니다.

## 루트 명령

루트 명령은 모두 `apps/kmsf` workspace로 위임된다.

```bash
npm run dev
npm run build
npm run lint
npm run test:run
npm run test:e2e
npm run test:e2e:headed
npm run verify
```

## 앱 환경 변수

메인 앱 환경 변수 파일은 `apps/kmsf` 아래에 둔다.

```bash
cp apps/kmsf/.env.example apps/kmsf/.env.local
```

예시:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_key
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
```

인증 provider, Supabase Google OAuth, local-json ID/PW provider 설정은 [인증 가이드](<repo-root>/docs/auth-guide.md)를 참고한다.

## 검증 기준

완료 전 기본 검증:

- `npm run lint`
- `npm run test:run`
- `npm run build`
- 렌더링 변경 시 브라우저 검증

브라우저 검증 경로:

1. Codex in-app browser
2. Codex computer use
3. `npm run test:e2e:headed`

## 보고 규칙

- 작업 보고서는 작업 scope의 `reports/YYYY-MM-DD.md` 형식으로 기록한다.
- 같은 날짜의 요청 결과는 하나의 파일에 이어서 누적한다.
- 브라우저/테스트 산출물은 해당 workspace의 `reports/artifacts/` 아래에 둔다.
- package 작업 보고서는 `packages/<package>/reports/YYYY-MM-DD.md`에 둔다.

## 참고 문서

- 운영 문서: [docs/codex/README.md](<repo-root>/docs/codex/README.md)
- 작업 보고서: [reports/2026-04-23.md](<repo-root>/reports/2026-04-23.md)
