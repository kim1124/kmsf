# Tech Stack Decisions

기준일:
- 2026-04-21

## 확정 권장안

### 1. 프레임워크

- `Next.js latest`
- `React latest`
- `TypeScript`

권장 선택:
- `create-next-app` 기반으로 템플릿 생성
- `App Router` 필수 사용
- `src/` 디렉터리 사용

근거 및 시니어 FE 관점:
- Next.js 공식 가이드라인은 `create-next-app`을 활용하여 보일러플레이트를 줄일 것을 권장합니다.
- App Router는 향후 React의 방향성(Server Components, Server Actions 등)을 적극 활용할 수 있는 라우터 패턴입니다. 아키텍처의 중앙 집중식 데이터 패칭에 적합합니다.

### 2. 스타일 / UI

- `tailwindcss`
- `shadcn/ui`

권장 선택:
- 템플릿 기본 스타일링은 Tailwind CSS를 통한 Utility-first 접근 방식을 취합니다.
- 공통 컴포넌트는 헤비한 외부 라이브러리 대신 소유권을 가지는 shadcn/ui를 활용합니다.

근거 및 시니어 FE 관점:
- 디자인 시스템을 구축할 때 특정 컴포넌트 라이브러리(ex: MUI, Ant Design)에 기능이 종속되어 한계점을 맞이하는 경우가 많습니다. shadcn/ui는 컴포넌트 코드를 직접 소유하고 커스텀하므로, 구조적 제약을 탈피할 수 있어 아키텍처적으로 우수합니다.

### 3. 다국어(i18n)

권장 선택:
- `next-intl`

근거 및 시니어 FE 관점:
- Next.js의 App Router, 특히 RSC와 원활하게 호환되는 i18n 솔루션으로 현재 실무에서 가장 안정적인 포지션을 취하고 있습니다. 무거운 클라이언트 사이드 번들을 늘리지 않고 SSR 기반에서 로케일 패치를 최적화할 수 있습니다.

### 4. 상태 관리

권장 선택:
- `zustand`

근거 및 시니어 FE 관점:
- App Router 환경에서는 비동기 서버 상태(데이터 패칭)는 Next.js 내장 캐싱/Fetch나 React Query 등을 활용하고, 클라이언트 상태 관리(UI 토글, 오디오 플레이어 등)는 번들이 가볍고 React Hooks와 유사한 형태의 Zustand를 결합하는 것이 보일러플레이트 감소에 큰 이점이 있습니다.

### 5. 데이터베이스 / 백엔드 BaaS

권장 선택:
- `Supabase`

권장 운영 모델:
- 로컬 개발: `Supabase CLI + local stack` (Docker 기반)
- 원격 운영: Supabase 프로젝트 연결

근거 및 시니어 FE 관점:
- 프론트엔드 주도적인 개발 주기를 가져가기 위해 Supabase는 SSR 환경에서 쿠키 및 세션 핸들링이 편리하며(@supabase/ssr), 데이터 모델링이 PostgreSQL에 기반하기 때문에 백엔드 없는 환경에서도 엔터프라이즈급 구조를 설계하기 적합합니다.

### 6. 빌드 도구

결론:
- 메인 빌더는 Next.js 내장 Webpack 또는 Turbopack을 활용합니다.

근거 및 시니어 FE 관점:
- Vite가 개발자 경험은 우수하더라도, Next.js 프로젝트에서는 생태계와 라우팅, SSR 처리를 완벽하게 지원하는 기본 빌더를 혼용하는 것은 맞지 않습니다.

### 7. 테스트 도구

권장 선택:
- 단위 테스트: `Vitest + React Testing Library`
- E2E 테스트: `Playwright`

근거 및 시니어 FE 관점:
- 모던 프론트엔드 테스팅은 속도가 매우 중요합니다. Jest 대비 세팅이 간편하고 속도가 빠른 Vitest를 활용하며, 서버 컴포넌트 환경까지 완벽히 커버해야 하는 시나리오는 Playwright E2E로 분담하는 것이 아키텍처 테스트 전략에 유리합니다.

## TypeScript 기준

권장 원칙:
- `strict: true` 반드시 활성화
- `noImplicitAny`와 `strictNullChecks` 강제
- API 및 DB DTO/Entity의 타입은 명시적 관리

## 초기 패키지 기준안

핵심: `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `next-intl`, `zustand`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`
테스트: `vitest`, `@testing-library/react`, `playwright`

## 구현 시 생성 커맨드 초안

```bash
pnpm create next-app@latest
```
- pnpm을 사용하여 의존성 트리 설치 속도와 호이스팅 문제를 사전에 방지합니다.
