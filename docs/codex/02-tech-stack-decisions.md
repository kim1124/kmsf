# Tech Stack Decisions

기준일:
- 2026-04-18

## 확정 권장안

### 1. 프레임워크

- `Next.js latest`
- `React latest`
- `TypeScript`

권장 선택:
- `create-next-app` 기반으로 템플릿 생성
- `App Router` 사용
- `src/` 디렉터리 사용

근거:
- Next.js 공식 문서는 `create-next-app`을 시작점으로 안내한다.
- App Router는 Server Components, Suspense, Server Functions 등 최신 React 기능을 사용하는 기본 라우터다.

공식 문서:
- [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- [App Router](https://nextjs.org/docs/app)
- [Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)

### 2. 스타일 / UI

- `tailwindcss`
- `shadcn/ui`

권장 선택:
- 템플릿 기본 스타일 시스템은 Tailwind CSS
- 공통 UI 컴포넌트는 shadcn/ui 기반

근거:
- shadcn/ui의 Next.js 설치 가이드는 Next.js 프로젝트와의 직접적인 조합을 공식 지원한다.
- 팀 단위 템플릿 관점에서 shadcn/ui는 "사전 제작된 검은 상자 UI 라이브러리"보다 커스터마이징과 소스 소유에 유리하다.

공식 문서:
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui Next.js 설치](https://ui.shadcn.com/docs/installation/next)

### 3. 다국어(i18n)

권장 선택:
- `next-intl`

판단:
- 이것은 Next.js 공식 내장 기능만으로 끝내는 방식이 아니라, App Router에서 실무적으로 가장 무난한 외부 i18n 라이브러리를 선택하는 결정이다.
- `next-intl`은 Next.js App Router와 Server Components 환경에 잘 맞고, Next.js 공식 i18n 가이드의 리소스 목록에도 등장한다.

주의:
- "가장 많이 사용"은 공식 문서만으로 단정할 수 없으므로, 본 문서에서는 `가장 많이 사용` 대신 `가장 유력한 기본 추천안`으로 기록한다.

공식 문서:
- [Next.js Internationalization](https://nextjs.org/docs/app/guides/internationalization)
- [next-intl](https://next-intl.dev/)

### 4. 상태 관리

권장 선택:
- `zustand`

판단:
- 이 선택은 공식 Next.js 기본 내장 스택이 아니라 생태계 추천안이다.
- 템플릿 기본 상태 관리로는 Redux Toolkit보다 가볍고, App Router 혼합 구조에서 시작 비용이 낮다.
- 전역 클라이언트 상태가 아주 복잡해지면 프로젝트별로 Redux Toolkit, TanStack Query 조합 등을 추가 검토할 수 있다.

주의:
- `zustand`를 "절대적인 업계 1위"라고 단정하지 않는다. 템플릿 초기값으로 적합하다는 관점의 추천이다.

공식 문서:
- [Zustand + Next.js 가이드](https://zustand.docs.pmnd.rs/learn/guides/nextjs)

### 5. 데이터베이스 / 백엔드 BaaS

권장 선택:
- `Supabase`

권장 운영 모델:
- 로컬 개발: `Supabase CLI + local stack`
- 원격 개발/운영: Supabase 프로젝트 연결

판단:
- Supabase는 Next.js App Router, Auth, SSR 패턴과 연결성이 좋다.
- 개발용 임시 모듈이 있는지에 대한 요청에는 `Supabase CLI로 로컬 스택을 띄우는 방식`이 가장 적절하다.

공식 문서:
- [Supabase Next.js Auth Quickstart](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)

### 6. 빌드 도구

결론:
- `Vite는 Next.js의 메인 빌드 도구로 사용하지 않는다.`
- 템플릿은 `next dev`, `next build`, `next start`를 기본으로 채택한다.

이유:
- Next.js 프로젝트는 자체 빌드/런타임 체계를 사용한다.
- Vite는 React 앱의 빌드 도구로는 훌륭하지만, Next.js 앱의 표준 빌드 도구로 채택하는 구조는 맞지 않는다.
- `2026-04-18` 기준으로 Next.js 문서에서는 Turbopack이 통합 번들러로 제공되지만, production build는 아직 alpha 문구가 남아 있어 템플릿의 기본 production build 도구로 강제 채택하기에는 보수적으로 접근하는 편이 안전하다.

공식 문서:
- [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- [Turbopack](https://nextjs.org/docs/architecture/turbopack)

### 7. 테스트 도구

권장 선택:
- 단위 테스트: `Vitest + React Testing Library`
- E2E 테스트: `Playwright`

이유:
- Next.js는 Vitest 가이드를 제공한다.
- 다만 Next.js 공식 문서상 `async Server Components`는 Vitest/Jest가 완전하지 않으므로 E2E 테스트를 병행하는 것이 안전하다.

공식 문서:
- [Next.js Testing with Vitest](https://nextjs.org/docs/app/guides/testing/vitest)
- [Next.js Testing with Playwright](https://nextjs.org/docs/app/guides/testing/playwright)

## TypeScript 기준

권장 원칙:
- 템플릿 기본 언어는 `TypeScript`
- `strict` 모드 활성화
- `any` 사용 최소화
- 공용 DTO, API 응답, 환경변수는 타입 명시

비고:
- 실제 `tsconfig` 상세 옵션은 구현 단계에서 Next.js 최신 기본값과 충돌 없이 정리한다.

## 초기 패키지 기준안

핵심:
- `next`
- `react`
- `react-dom`
- `typescript`
- `tailwindcss`
- `next-intl`
- `zustand`
- `@supabase/supabase-js`
- `@supabase/ssr`
- `zod`

테스트:
- `vitest`
- `@testing-library/react`
- `@testing-library/dom`
- `jsdom`
- `playwright`

UI:
- `shadcn/ui` CLI 기반 추가
- `lucide-react`

## 구현 시 생성 커맨드 초안

```bash
pnpm create next-app@latest
```

추천 옵션:
- TypeScript: Yes
- App Router: Yes
- Tailwind CSS: Yes
- ESLint: Yes
- `src/` directory: Yes
- Import alias: `@/*`

## 추론 메모

아래 항목은 공식 문서 그 자체가 아니라 생태계/실무 관점 추천이다.

- i18n 기본 라이브러리로 `next-intl`
- 상태 관리 기본 라이브러리로 `zustand`

이 두 항목은 실제 구현 전 최종 합의 대상으로 본다.
