# Architecture and Layout

## 라우팅 전략

권장 구조 (Next.js App Router 기반):
- `src/app` 코어 기반 관리
- 인증 분기에 의한 Route Group 활용 `(public)`, `(protected)`
- 다국어 설정을 위한 `[locale]` 동적 라우팅 세그먼트

예시:
```text
src/
  app/
    [locale]/
      (public)/
        sign-in/
        sign-up/
      (protected)/
        dashboard/
        settings/
      layout.tsx
      page.tsx
    api/
  components/
    ui/        // shadcn 등 재사용 가능한 아토믹 UI 원시 컴포넌트
    layout/    // Header, Footer, Sidebar 등 조합 컴포넌트
  features/    // 도메인 주도 설계(DDD) 기준의 패키지 분리 (ex. auth, dashboard)
  lib/         // 서드파티 라이브러리 초기화, 서버 액션 및 유틸리티
  stores/      // Zustand 클라이언트 전역 상태 보관소
  types/
  hooks/       // 클라이언트 상태 로직
  styles/      // 글로벌 CSS 및 변수 토큰
messages/
supabase/      // DB 마이그레이션 및 설정
```

설계 의도 (시니어 FE 관점):
전통적인 `components`, `pages` 구분에서 벗어나 `features` 디렉터리를 도입함으로써 관심사 분리(SoC)를 명확히 합니다. 대규모 프로젝트로 성장할수록 도메인별 응집도가 높아져 리팩토링이나 유지보수 관점에서 훨씬 유리한 구조입니다.

## SSR / CSR / Hydration 원칙

기본 원칙:
- 모든 컴포넌트의 디폴트는 **Server Component** (비동기 Fetch 최적화, 보안 토큰 숨김, 번들 사이즈 최적화)
- 상태가 변하거나 DOM 이벤트를 처리해야 하는 지점에서만 Leaf 단위로 분리하여 **Client Component** 사용

클라이언트 컴포넌트 전환 경계 팁:
- `useState`, `useEffect`, `useRef` 등의 훅 사용 시
- 브라우저 Web API (`window`, `localStorage`) 필요 시
- 상호작용이 복잡한 위젯 영역

## 레이아웃 요구사항 정리

### 공통 레이아웃
- 모바일 퍼스트 및 반응형 기반 설계
- `(protected)` 영역은 권한(세션) 검증 후 진입. 좌측 사이드바 + 상단 네비게이션 또는 모바일 환경에서의 바텀 네비게이션으로 유연하고 동적인 전환이 필요합니다.

### SSR/RSC 정책
서버 렌더링 영역: 기본 App Shell, 헤더(서버 세션을 통한 프로필 이미지), 사이드바 메뉴 트리
클라이언트 렌더링 영역: 아코디언 메뉴의 확장/접힘, 테마 모드(Dark/Light) 토글 등

## 권장 레이아웃 구조 (컴포넌트 합성)

```tsx
// src/app/[locale]/(protected)/layout.tsx (Server Component)
export default async function ProtectedLayout({ children }) {
  const session = await getSession();
  const menus = await fetchMenusByRole(session.user.role);

  return (
    <AppShell>
      <AppSidebar menus={menus} />
      <AppHeader user={session.user} />
      <main>{children}</main>
      <MobileBottomNav menus={menus} />
    </AppShell>
  );
}
```

의도: 
레이아웃 뼈대 자체는 서버에서 구축하고, 인증 정보나 데이터 소스는 Props로 전달하여 트리의 하위 `Client Components`에 주입(Hydration) 하는 패턴을 확립합니다. 이 방식은 Waterfall Fetching을 방지합니다.

## 권한/메뉴 설계 초안 및 i18n 병합

메뉴는 추후 역할 기반(RBAC) 시스템으로 확장될 것을 대비하여, 역할을 명시적으로 추가 관리할 수 있도록 설계합니다. 라우팅 시 `/[locale]` 접두어가 브라우저 URL에 항상 존재해야 i18n 상태 추적이 간단해지므로 Root Layout에서 middleware를 통한 Rewrite/Redirect 처리를 고려해야 합니다.
