# KMSF

KMSF는 Next.js 기반 애플리케이션을 빠르게 시작하기 위한 보일러플레이트와 재사용 React 패키지를 함께 관리하는 npm workspaces 저장소다.

저장소의 중심은 `apps/kmsf` 앱이며, `packages/*`는 KMSF 앱과 외부 React/Vite/Next.js 소비 프로젝트에서 재사용할 수 있는 패키지로 분리한다.

## 현재 구조

```text
kmsf/
├── apps/
│   └── kmsf/                 # 메인 Next.js App Router 앱
├── examples/
│   └── basic-dashboard/      # 패키지 소비 검증용 예제 앱
├── packages/
│   ├── charts/               # @kmsf/charts
│   ├── chat/                 # @kmsf/chat
│   ├── create-kmsf/          # create-kmsf CLI
│   ├── data-table/           # @kmsf/data-table
│   ├── generator-core/       # @kmsf/generator-core
│   └── gridstack/            # @kmsf/gridstack
├── templates/
│   ├── backend-base/         # 향후 backend scaffold 후보
│   ├── next-app-auth/        # auth 참고 템플릿 후보
│   ├── next-app-base/        # Next.js 앱 템플릿 원본
│   └── next-monorepo/        # 향후 monorepo scaffold 후보
├── .agents/skills/           # KMSF repo-local Codex skills
├── AGENTS.md                 # 저장소 공통 Codex 실행 계약
└── package.json              # root workspace orchestration
```

## 메인 앱

- 경로: `apps/kmsf`
- package name: `@kmsf/app-kmsf`
- 기술 스택: Next.js 16, React 19, TypeScript, Tailwind CSS 4, next-intl, Radix UI, lucide-react
- 저장소: Supabase, LowDB 기반 Dev Local DB, sqlite3 기반 Local DB, 외부 DB adapter 후보
- 인증: Manual, KMSF-managed local provider, Supabase Auth

자세한 앱 실행과 초기 설정 흐름은 [apps/kmsf/README.md](apps/kmsf/README.md)를 참고한다.

## 현재 앱 기능

- 초기 설정 wizard
  - GNB 영역 선택: top, left, right, footer
  - DB 선택: none, Dev Local DB, SQLite3, External Adapter, Supabase
  - 인증 선택: Manual, KMSF-managed, Supabase
  - 설정 저장 선택: manual, localStorage, connected DB
  - 메뉴 구성 선택: manual, app routes, settings UI
- Manual 설정 완료 시 인증 없이 KMSF welcome page 표시
- KMSF-managed 또는 Supabase 인증 선택 시 초기 admin 계정 생성
- Supabase 환경 변수 기반 availability check와 기존 Supabase setup 감지
- 로그인, 회원가입, 세션 만료, 계정 정보 변경, 회원 탈퇴
- level/role 기반 설정 페이지 접근 제어
- 시스템 정보, 계정 관리, GNB 설정, 시스템 초기화 설정 화면
- 계정별 desktop GNB 출력/숨김 설정
- factory reset, backup, audit event 흐름
- ko/en i18n 라우팅과 언어 전환
- sample pages: dashboard, analytics, chart sample, data-table sample

## 패키지

| Workspace | Package | 역할 |
| --- | --- | --- |
| `packages/charts` | `@kmsf/charts` | ECharts 기반 React chart 컴포넌트 |
| `packages/chat` | `@kmsf/chat` | Ollama 중심 local LLM chat UI와 storage adapter |
| `packages/data-table` | `@kmsf/data-table` | CSR 중심 React data table과 core helper |
| `packages/gridstack` | `@kmsf/gridstack` | GridStack 기반 dashboard layout 컴포넌트 |
| `packages/create-kmsf` | `create-kmsf` | standalone Next.js 앱 scaffold CLI |
| `packages/generator-core` | `@kmsf/generator-core` | template copy/transform engine |

## 루트 명령

루트 명령은 기본적으로 `apps/kmsf` workspace로 위임된다.

```bash
npm run dev
npm run lint
npm run test:run
npm run build
npm run verify
npm run verify:full
```

패키지별 playground 또는 검증은 workspace 명령으로 실행한다.

```bash
npm --workspace=@kmsf/charts run dev
npm --workspace=@kmsf/chat run dev
npm --workspace=@kmsf/data-table run dev
npm --workspace=@kmsf/gridstack run dev

npm --workspace=@kmsf/charts run verify
npm --workspace=@kmsf/chat run verify
npm --workspace=@kmsf/data-table run verify
npm --workspace=@kmsf/gridstack run verify
npm --workspace=create-kmsf run verify
npm --workspace=@kmsf/generator-core run verify
```

패키지 전체 baseline 검증은 명시적으로 필요할 때만 실행한다.

```bash
npm run verify:packages
npm run verify:all
```

## 환경 변수

메인 앱 환경 변수는 `apps/kmsf` 아래에서 관리한다.

```bash
cp apps/kmsf/.env.example apps/kmsf/.env.local
```

주요 변수:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_API_KEY=your_supabase_publishable_or_anon_key
SUPABASE_SECRET_KEY=<server-only-value>
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
```

`SUPABASE_SECRET_KEY`는 서버 전용으로만 사용해야 하며 클라이언트 코드나 공개 문서에 실제 값을 노출하지 않는다.

## Codex 지침

- 저장소 공통 계약: [AGENTS.md](AGENTS.md)
- 앱 지침: [apps/kmsf/AGENTS.md](apps/kmsf/AGENTS.md)
- repo-local skills: [.agents/skills](.agents/skills)

## README 운영 기준

- README는 현재 구현된 기능과 실행 가능한 명령을 기준으로 작성한다.
- 완료되지 않은 roadmap은 구현 기능처럼 작성하지 않는다.
- local-only report, private guide, artifact 경로는 public README에서 링크하지 않는다.
