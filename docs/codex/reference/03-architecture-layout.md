# Architecture and Layout

## 라우팅 전략

권장:
- `src/app` 기반 App Router
- locale 세그먼트를 고려한 구조

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
    ui/
    layout/
  features/
    auth/
    dashboard/
    settings/
  lib/
    supabase/
    auth/
    i18n/
    security/
  stores/
  types/
  hooks/
  styles/
messages/
supabase/
```

설계 의도:
- `app`은 라우팅과 레이아웃 중심
- `features`는 도메인 중심
- `components/ui`는 shadcn/ui 및 공통 UI
- `lib`는 프레임워크/인프라/공통 유틸
- `stores`는 클라이언트 전역 상태

참고:
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)

## SSR / CSR / Hydration 원칙

기본 원칙:
- 기본값은 서버 컴포넌트
- 아래 경우에만 클라이언트 컴포넌트 사용

클라이언트 컴포넌트 사용 조건:
- 브라우저 이벤트 처리
- `useState`, `useEffect` 등 클라이언트 훅 필요
- 브라우저 API 접근
- 실시간 상호작용
- zustand store 직접 구독

권장:
- 페이지의 바깥 뼈대와 데이터 패칭은 서버에서 처리
- 상호작용 위젯만 클라이언트 섬(island)으로 분리

## 레이아웃 요구사항 정리

### 공통 레이아웃

- 데스크톱/모바일 대응
- Left 영역은 탐색 메뉴
- Top 영역은 프로젝트 아이콘 + 프로젝트명 + 사용자 메뉴
- 모바일에서는 Left 탐색을 Bottom Navigation 또는 Drawer로 전환

### SSR 정책

아래는 서버 렌더링 우선:
- 메인 레이아웃 shell
- 프로젝트명
- 메뉴 구성 정보
- 사용자 세션 기반 헤더 정보

아래는 클라이언트 전환 가능:
- 사이드바 접힘/펼침
- 모바일 바텀 네비게이션 인터랙션
- 알림, 토스트, 실시간 검색, 차트 상호작용

## 권장 레이아웃 구조

```text
src/app/[locale]/(protected)/layout.tsx
src/components/layout/app-shell.tsx
src/components/layout/app-sidebar.tsx
src/components/layout/app-header.tsx
src/components/layout/mobile-bottom-nav.tsx
```

구성 원칙:
- `layout.tsx`는 서버 컴포넌트로 세션과 메뉴 데이터를 준비
- 실제 인터랙션이 필요한 일부 하위 컴포넌트만 `use client`

## 메뉴/권한 설계 초안

초기 권장 구조:

```ts
type AppNavItem = {
  key: string
  label: string
  href: string
  icon: string
  roles?: string[]
}
```

의도:
- 향후 RBAC 확장 가능
- 서버에서 세션과 역할을 읽어 네비게이션을 필터링 가능

## i18n 라우팅 방향

권장:
- `/ko`, `/en` 형태의 locale prefix
- 기본 locale은 추후 결정

이유:
- 명시적인 라우팅 구조가 운영과 SEO에 유리하다.
- App Router와 next-intl 조합에서 관리가 쉽다.

참고:
- [Next.js Internationalization](https://nextjs.org/docs/app/guides/internationalization)

## 플러그인 확장 고려

향후 플러그인 추가를 고려하여 아래 구조를 권장한다.

```text
src/features/chart/
src/features/data-table/
src/plugins/
```

기본 정책:
- 메인 템플릿은 플러그인 의존성을 최소화한다.
- 차트, 데이터 테이블은 별도 패키지 또는 선택 설치 가능한 모듈로 분리한다.
