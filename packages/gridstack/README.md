# @kmsf/gridstack

`@kmsf/gridstack`는 KMSF 대시보드 화면에서 재사용하기 위한 React 기반 자율형 GridStack 레이아웃 패키지다.

## 현재 제공 범위

- 위젯 추가, 수정, 삭제를 위한 `useDashboardGrid` hook
- GridStack 기반 `DashboardGrid` React 컴포넌트
- 위젯 최대화, 최소화, 복원 명령
- `1..12` 컬럼 변경과 컬럼 값 clamp helper
- 자동 정렬 helper
- 이동/크기 조절 enable, disable 옵션
- `requestAnimationFrame` 기반 resize scheduler
- Vite dev example
- Vitest, Playwright 검증 환경

## 개발 실행

```bash
npm run dev
npm run lint
npm run test:run
npm run build
npm run test:e2e
```

## 기본 사용 예시

```tsx
import { DashboardGrid, useDashboardGrid } from "@kmsf/gridstack";
import type { DashboardWidget } from "@kmsf/gridstack";
import "gridstack/dist/gridstack.min.css";
import "@kmsf/gridstack/styles.css";

const initialWidgets: DashboardWidget[] = [
  {
    id: "sales",
    title: "Sales",
    layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 },
  },
];

export function DashboardPage() {
  const dashboard = useDashboardGrid({
    initialColumns: 6,
    initialWidgets,
  });

  return (
    <DashboardGrid
      columns={dashboard.columns}
      refreshKey={dashboard.refreshVersion}
      widgets={dashboard.widgets}
      onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
      onMaximizeWidget={dashboard.commands.maximizeWidget}
      onMinimizeWidget={dashboard.commands.minimizeWidget}
      onRestoreWidget={dashboard.commands.restoreWidget}
      onRemoveWidget={dashboard.commands.removeWidget}
      renderWidget={(widget) => <div>{widget.title}</div>}
    />
  );
}
```

## 설계 원칙

- React public API와 GridStack instance를 분리한다.
- 소비자는 serializable layout snapshot을 기준으로 저장/복원한다.
- GridStack 직접 접근은 `src/gridstack` adapter 내부로 제한한다.
- drag/resize hot path에서 React state update를 과도하게 발생시키지 않는다.
- 위젯 ID를 모든 상태 전환의 기준으로 사용한다.

## 스타일 커스터마이징

기본 스타일은 `@kmsf/gridstack/styles.css`로 분리되어 있다. 소비 앱은 GridStack 기본 CSS 다음에 이 파일을 import하고, 필요한 경우 CSS 변수 또는 Tailwind `@layer components`에서 덮어쓴다.

```css
.kmsf-dashboard-grid {
  --kmsf-dashboard-accent: #84cc16;
  --kmsf-dashboard-accent-soft: #f7fee7;
  --kmsf-dashboard-border: #d9e2ea;
  --kmsf-dashboard-radius: 6px;
  --kmsf-dashboard-shadow: none;
}
```

Tailwind 사용 시에는 패키지 class를 그대로 대상으로 삼을 수 있다.

```css
@layer components {
  .kmsf-dashboard-widget {
    @apply border border-slate-200 bg-white shadow-sm;
  }

  .kmsf-dashboard-widget__header {
    @apply min-h-11 px-3 py-2;
  }
}
```

기본 팔레트는 KMSF 권장 방향에 맞춰 light base와 mint accent를 사용한다.

## 구현 참고

- 순수 상태 전환은 `src/core`에 있다.
- GridStack option mapping과 lifecycle은 `src/gridstack`에 있다.
- React 컴포넌트는 `src/components`에 있다.
- 실제 사용 예제는 `example/src/main.tsx`에 있다.
