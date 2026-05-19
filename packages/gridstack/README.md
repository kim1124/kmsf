# @kmsf/gridstack

`@kmsf/gridstack`는 React 애플리케이션에서 대시보드 위젯 레이아웃을 구성하기 위한 GridStack 기반 컴포넌트 패키지다.

KMSF boilerplate 소비 앱을 주요 대상으로 하지만, 런타임은 Next.js API에 의존하지 않는다. 일반 React, Vite, Next.js client component 환경에서 사용할 수 있도록 public API를 React와 serializable layout state 중심으로 유지한다.

## Features

- `DashboardGrid` React component
- `useDashboardGrid` state and command hook
- Widget create, update, remove, clear
- Maximize, minimize, restore
- Runtime column count control from `1` to `12`
- Auto-arrange and fit-to-columns helpers
- Movable and resizable interaction options
- Scheduled widget resize frame callback
- Serializable layout and state snapshots
- GridStack adapter boundary hidden behind package-owned APIs

## Installation

```bash
npm install @kmsf/gridstack
```

Install peer dependencies if the consuming app does not already provide them.

```bash
npm install react react-dom
```

`gridstack` is used as the runtime grid engine. Import the GridStack stylesheet before the package stylesheet.

```ts
import "gridstack/dist/gridstack.min.css";
import "@kmsf/gridstack/styles.css";
```

## Quick Start

```tsx
import { DashboardGrid, useDashboardGrid } from "@kmsf/gridstack";
import type { DashboardWidget } from "@kmsf/gridstack";
import "gridstack/dist/gridstack.min.css";
import "@kmsf/gridstack/styles.css";

type MetricData = {
  value: string;
  description: string;
};

const initialWidgets: DashboardWidget<MetricData>[] = [
  {
    id: "sales",
    title: "Sales",
    layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 },
    data: { value: "$128k", description: "Monthly recurring revenue" },
  },
  {
    id: "traffic",
    title: "Traffic",
    layout: { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
    data: { value: "42.8k", description: "Active sessions" },
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
      refreshKey={dashboard.refreshVersion}
      widgets={dashboard.widgets}
      onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
      onMaximizeWidget={dashboard.commands.maximizeWidget}
      onMinimizeWidget={dashboard.commands.minimizeWidget}
      onRestoreWidget={dashboard.commands.restoreWidget}
      onRemoveWidget={dashboard.commands.removeWidget}
      renderWidget={(widget) => (
        <div>
          <strong>{widget.data?.value}</strong>
          <p>{widget.data?.description}</p>
        </div>
      )}
    />
  );
}
```

## State Hook

`useDashboardGrid` owns the serializable dashboard state and exposes command helpers.

```ts
const dashboard = useDashboardGrid({
  initialColumns: 6,
  initialWidgets,
});
```

Returned fields:

- `state`: full dashboard state
- `widgets`: current widget list
- `columns`: current clamped column count
- `refreshVersion`: value used to request a GridStack refresh
- `commands`: mutation, layout, serialization, and refresh commands

Common commands:

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
- `fitWidgetToColumns(id)`
- `setColumns(columns)`
- `resetLayout(snapshot?)`
- `restoreLayout(snapshot)`
- `refreshLayout()`
- `serializeLayout()`
- `serializeState()`

## Component API

`DashboardGrid` renders the widget grid and bridges React state to the GridStack adapter.

Important props:

| Prop | Type | Description |
| --- | --- | --- |
| `widgets` | `DashboardWidget<TData>[]` | Widget models to render. |
| `columns` | `1..12` | Runtime column count. Defaults to `12`. |
| `editable` | `boolean` | Enables or disables all edit interactions. |
| `movable` | `boolean` | Enables or disables widget movement. |
| `resizable` | `boolean` | Enables or disables widget resizing. |
| `refreshKey` | `number` | Requests adapter refresh when changed. |
| `showControls` | `boolean` | Shows built-in widget action buttons. |
| `actionLabels` | `Partial<DashboardWidgetActionLabels>` | Localizes built-in action labels. |
| `renderWidget` | `(widget) => ReactNode` | Renders consumer-owned widget content. |
| `onLayoutCommit` | `(snapshot) => void` | Receives committed layout snapshots. |
| `onWidgetLayoutChange` | `(id, layout) => void` | Receives per-widget layout changes. |
| `onWidgetResizeFrame` | `(event) => void` | Receives scheduled resize frame events. |

## Layout Model

Widgets use stable string IDs and serializable layout objects.

```ts
type DashboardWidgetLayout = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
};

type DashboardWidget<TData = unknown> = {
  id: string;
  title?: string;
  layout: DashboardWidgetLayout;
  data?: TData;
  minimized?: boolean;
  maximized?: boolean;
  locked?: boolean;
};
```

Use `serializeLayout()` when only layout coordinates are needed. Use `serializeState()` when widget metadata and `data` should also be persisted.

## Styling

The package ships a small default stylesheet.

```ts
import "gridstack/dist/gridstack.min.css";
import "@kmsf/gridstack/styles.css";
```

KMSF global tokens can be overridden at `:root`, and package-local variables can be overridden on the grid root.

```css
:root {
  --kmsf-color-accent: #2563eb;
  --kmsf-radius-md: 0.5rem;
}

.kmsf-dashboard-grid {
  --kmsf-dashboard-shadow: none;
  --kmsf-dashboard-header-min-height: 40px;
}
```

Tailwind consumers can target package classes from their own component layer.

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

## Design Notes

- React public API and GridStack runtime are separated by `src/gridstack`.
- Consumers persist serializable layout or state snapshots.
- Widget IDs are preserved across layout operations.
- Runtime column count is clamped to `1..12`.
- Drag and resize events are kept behind the adapter boundary.
- Resize frame notifications are scheduled with `requestAnimationFrame`.

## Development

Run commands from `packages/gridstack`.

```bash
npm run dev
npm run lint
npm run test:run
npm run build
npm run test:e2e
npm run verify
```

Command scope:

- `npm run dev`: Vite example app
- `npm run lint`: TypeScript typecheck
- `npm run test:run`: Vitest unit tests
- `npm run build`: package build
- `npm run test:e2e`: Playwright browser checks
- `npm run verify`: lint, Vitest, and build baseline

The example dev server uses port `6001` by default because Chromium blocks `6000` as an unsafe port. If the port is already in use, choose the next available port explicitly:

```bash
KMSF_GRIDSTACK_PORT=6002 npm --workspace=@kmsf/gridstack run dev
KMSF_GRIDSTACK_PORT=6002 npm --workspace=@kmsf/gridstack run test:e2e
```

## Repository Layout

```text
src/core
  Serializable state, layout helpers, column helpers, resize scheduler, shared types

src/gridstack
  GridStack option mapping, adapter lifecycle, event bridge

src/components
  React grid and widget shell components

example
  Vite/React consumer example

test
  Vitest, Playwright, and package-local reports
```

## Publishing Notes

This package may be published to the npm registry, but the current repository metadata must be reviewed before publishing.

Before `npm publish`, confirm:

- `package.json` no longer has `"private": true`.
- `exports` points to the intended published artifact paths.
- `files`, `license`, `repository`, and package description are set.
- Runtime dependencies and peer dependencies are intentional.
- `npm run verify` passes from `packages/gridstack`.
- Browser-visible changes have Playwright coverage or a documented reason for skipping.

Do not publish directly from an unverified working tree.

## License

This package is currently maintained for KMSF project usage. Add the final license metadata before public npm publication.
