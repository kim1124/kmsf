# Gridstack Docs Example Composition Spec

## Metadata

- Date: 2026-07-01
- Scope: `packages/gridstack` example, public widget interaction API, docs playground, and package-local tests
- Status: Approved for implementation planning
- ask gate: clear

## Supervisor Decisions

- Add widget-level `movable?: boolean` and `resizable?: boolean`.
- Keep `locked` as a compatibility shortcut that disables both movement and resizing.
- Add Dialog and Select as package-local example UI components, not as runtime package dependencies.
- Build the composite example as one smoke surface, not as a nested rendering of all pages.
- Document only public `@kmsf/gridstack` APIs.
- Include runtime API changes in this work.

## Public API Contract

`DashboardWidget<TData>` gains optional per-widget interaction flags:

```ts
type DashboardWidget<TData = unknown> = {
  id: DashboardWidgetId;
  title?: string;
  layout: DashboardWidgetLayout;
  data?: TData;
  minimized?: boolean;
  maximized?: boolean;
  locked?: boolean;
  movable?: boolean;
  resizable?: boolean;
};
```

Behavior:

- `locked: true` disables both move and resize.
- `movable: false` disables move for that widget.
- `resizable: false` disables resize for that widget.
- Global `editable`, `movable`, and `resizable` still gate all widgets.
- Widget-level `movable: true` must not override a global `movable={false}`.
- Widget-level `resizable: true` must not override a global `resizable={false}`.

## Example Pages

### Basic

- 12-column layout.
- 12 preloaded widgets with different widths/heights.
- Controls limited to move/resize inspection when useful.
- Focus: user can see drag and resize behavior without CRUD noise.

### CRUD

- Three default widgets.
- Add, update, delete widget flows.
- Add flow opens a package-local Dialog.
- Dialog includes new widget width and height Select controls.
- Focus: widget model creation and state update behavior.

### Layout

- Save layout and restore layout buttons.
- Column Select with options 1 through 12.
- Global layout lock/unlock.
- Include a 12-widget column-change example with distinct widget options.
- Focus: serializable state, dynamic column changes, and global interaction policy.

### Widget

- CRUD-based setup.
- Per-widget resize, move, resize lock, and move lock controls.
- Focus: individual widget interaction contracts.

### Complete

- One integrated smoke example.
- Covers CRUD, layout save/restore, column changes, global lock, per-widget locks, move, and resize.
- Does not embed all other pages wholesale.

### API

- Categories:
  - `DashboardGrid` props
  - `useDashboardGrid` options and commands
  - `DashboardWidget`
  - `DashboardWidgetLayout`
  - snapshots and serialization
  - interaction options
- Each category includes option name, description, and focused code example.
- Raw GridStack engine options are excluded unless explicitly exposed by `@kmsf/gridstack`.

## Verification Contract

- Vitest:
  - widget-level interaction flag mapping
  - `locked` compatibility
  - global option precedence over widget-level flags
- Playwright:
  - route navigation
  - code/example/live example visibility
  - CRUD Dialog add/update/delete flow
  - save/restore and column Select
  - global layout lock/unlock
  - per-widget move lock and resize lock
  - complete example smoke path
- Completion gate:
  - focused tests first
  - `npm --workspace=@kmsf/gridstack run verify`
  - `npm --workspace=@kmsf/gridstack run verify:full`
