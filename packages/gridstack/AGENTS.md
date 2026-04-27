# @kmsf/gridstack Package Contract

## Purpose

This package provides autonomous dashboard layout primitives for KMSF boilerplate consumers.

The package must work in generic React environments and must not depend on Next.js runtime APIs.

## Scope

- Package name: `@kmsf/gridstack`
- Runtime source: `src`
- React component source: `src/components`
- Grid engine adapter: `src/gridstack`
- Shared layout state, types, and scheduling helpers: `src/core`
- Package example: `example`
- Package-local verification artifacts: `test`

## Product Goals

- Dashboard consumers can create, read, update, and delete widgets.
- Widgets can be moved and resized by mouse drag and drop.
- Widgets can be maximized and minimized without losing their previous layout state.
- Dashboard layouts can be auto-arranged on demand.
- Column count can be changed from `1` to `12` at runtime.
- Movement and resizing can be enabled or disabled by option.
- Widget content can respond to size changes with a scheduled resize signal.
- Layout state can be initialized, refreshed, reset, and serialized.

## Technology Direction

- Use React and TypeScript for the public component API.
- Use Vite for package build and development examples.
- Use Vitest for pure layout helpers, state reducers, and adapter behavior.
- Use Playwright for drag, resize, maximize, minimize, and responsive browser checks.
- Use `gridstack` as the initial grid engine.
- Keep `react-grid-layout` as a documented alternative, not a runtime dependency, until the engine decision changes.

## Implementation Rules

- Do not introduce Next.js-only APIs.
- Keep React and React DOM as peer dependencies.
- Keep GridStack interaction behind a package-owned adapter boundary.
- Do not expose raw GridStack instances as the primary public API.
- Store layout state in serializable objects.
- Preserve widget IDs across all operations.
- Clamp runtime column count to the supported `1..12` range.
- Avoid full-layout deep clones in render paths.
- Avoid React state updates during drag or resize hot paths unless they are explicitly throttled.
- Use `requestAnimationFrame` or `ResizeObserver` based scheduling for content resize notifications.
- Clean up GridStack instances, event listeners, observers, and animation frame handles on unmount.

## Performance Rules

- Treat 100+ widgets and repeated column changes as baseline requirements.
- Keep drag and resize handlers imperative and narrowly scoped.
- Batch layout persistence after interaction completion when possible.
- Do not recreate GridStack instances for routine layout refreshes.
- Memoize derived widget collections only when the input identity and cost justify it.
- Prefer stable callback refs and event delegation over per-widget listener churn.

## Testing Rules

- Use Superpowers TDD for behavior changes after this initial scaffold.
- Documentation-only, instruction-only, and environment scaffold changes are TDD exceptions.
- For layout behavior implementation, write the smallest relevant Vitest or Playwright failing test before production code.
- Use package-local result folders:
  - `test/vitest`
  - `test/playwright`
  - `test/reports`
- Document any skipped browser check in `test/reports/YYYY-MM-DD.md`.

## Verification Commands

- `npm run lint`
- `npm run test:run`
- `npm run build`
- `npm run test:e2e` for browser-visible interaction or example changes
- `npm run verify` for the package baseline

## Reporting

Before closing substantial package work, update `test/reports/YYYY-MM-DD.md` with:

- timestamp
- summary
- changed files
- commands actually run
- pass/fail result
- residual risks or blockers
