# @kmsf/gridstack

`@kmsf/gridstack`는 React 애플리케이션에서 dashboard widget layout을 구성하기 위한 GridStack 기반 package다. 런타임은 Next.js API에 의존하지 않고 React component와 serializable layout state 중심으로 동작한다.

## 패키지 상태

- 현재 `package.json` 기준 `private: true`인 repository-local package다.
- React와 React DOM은 peer dependency로 유지한다.
- `gridstack`은 runtime dependency이며, consumer는 GridStack CSS와 package CSS를 함께 import해야 한다.
- npm 배포 전에는 `private`, license, repository, files, dependency, browser verification 상태를 별도 검토해야 한다.

## 구현된 기능

- `DashboardGrid` React component
- `useDashboardGrid` state/command hook
- widget create, update, remove, clear
- maximize, minimize, restore
- runtime column count `1..12`
- auto arrange와 fit-to-columns helper
- movable/resizable option
- scheduled widget resize frame callback
- serializable layout/state snapshot
- GridStack adapter boundary
- package stylesheet export

## Public API

| Import | 설명 |
| --- | --- |
| `@kmsf/gridstack` | `DashboardGrid`, `useDashboardGrid`, layout/state helpers, option mapper, public types |
| `@kmsf/gridstack/styles.css` | KMSF dashboard grid stylesheet |
| `kmsfGridstackPackage` | package 식별 상수 |

## 설치

```bash
npm install @kmsf/gridstack react react-dom
```

`gridstack` stylesheet을 package stylesheet보다 먼저 import한다.

```ts
import "gridstack/dist/gridstack.min.css";
import "@kmsf/gridstack/styles.css";
```

## 빠른 시작

```tsx
import { DashboardGrid, useDashboardGrid, type DashboardWidget } from "@kmsf/gridstack";
import "gridstack/dist/gridstack.min.css";
import "@kmsf/gridstack/styles.css";

type MetricData = {
  description: string;
  value: string;
};

const initialWidgets: DashboardWidget<MetricData>[] = [
  {
    id: "sales",
    title: "Sales",
    layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 },
    data: { value: "$128k", description: "MRR" },
  },
];

export function DashboardPage() {
  const dashboard = useDashboardGrid<MetricData>({
    initialColumns: 6,
    initialWidgets,
  });

  return (
    <DashboardGrid
      columns={dashboard.columns}
      onMaximizeWidget={dashboard.commands.maximizeWidget}
      onMinimizeWidget={dashboard.commands.minimizeWidget}
      onRemoveWidget={dashboard.commands.removeWidget}
      onRestoreWidget={dashboard.commands.restoreWidget}
      onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
      refreshKey={dashboard.refreshVersion}
      renderWidget={(widget) => <strong>{widget.data?.value}</strong>}
      widgets={dashboard.widgets}
    />
  );
}
```

## 주요 command

`useDashboardGrid`는 serializable dashboard state와 command helper를 제공한다.

- `addWidget(widget)`
- `updateWidget(id, patch)`
- `updateWidgetLayout(id, patch)`
- `removeWidget(id)`
- `clearWidgets()`
- `maximizeWidget(id)`
- `minimizeWidget(id)`
- `restoreWidget(id)`
- `autoArrangeWidgets()`
- `fitWidgetsToColumns()`
- `setColumns(columns)`
- `resetLayout(snapshot?)`
- `restoreLayout(snapshot)`
- `refreshLayout()`
- `serializeLayout()`
- `serializeState()`

## Component API 요약

| Prop | 설명 |
| --- | --- |
| `widgets` | 렌더링할 widget model |
| `columns` | runtime column count, 기본 `12` |
| `editable` | 전체 edit interaction 활성/비활성 |
| `movable` | widget move 활성/비활성 |
| `resizable` | widget resize 활성/비활성 |
| `refreshKey` | adapter refresh 요청 |
| `showControls` | 기본 widget control 표시 |
| `renderWidget` | consumer-owned widget content 렌더링 |
| `onLayoutCommit` | committed layout snapshot 수신 |
| `onWidgetLayoutChange` | widget별 layout 변경 수신 |
| `onWidgetResizeFrame` | scheduled resize frame event 수신 |

## Styling

```ts
import "gridstack/dist/gridstack.min.css";
import "@kmsf/gridstack/styles.css";
```

KMSF token과 package-local CSS variable을 override할 수 있다.

```css
:root {
  --kmsf-color-accent: #2563eb;
  --kmsf-radius-md: 0.5rem;
}

.kmsf-dashboard-grid {
  --kmsf-dashboard-shadow: none;
}
```

## Playground

루트에서 실행:

```bash
npm --workspace=@kmsf/gridstack run dev
```

기본 포트는 `6001`이다. Chromium unsafe port 이슈 때문에 `6000`은 사용하지 않는다.

포트 변경:

```bash
KMSF_GRIDSTACK_PORT=6002 npm --workspace=@kmsf/gridstack run dev
```

## 검증

```bash
npm --workspace=@kmsf/gridstack run lint
npm --workspace=@kmsf/gridstack run test:run
npm --workspace=@kmsf/gridstack run build
npm --workspace=@kmsf/gridstack run test:e2e
npm --workspace=@kmsf/gridstack run verify
npm --workspace=@kmsf/gridstack run verify:full
```

## Publishing note

현재 package는 KMSF 프로젝트 사용을 우선한다. npm publish 전에는 `private`, license, repository, files, dependency, browser verification 상태를 별도 검토해야 한다.
