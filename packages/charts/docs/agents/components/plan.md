# Components Plan

## Active Plan

1. Confirm whether the requested change affects public API, data contract, or rendered canvas.
2. Add or update the smallest Vitest or Playwright failing test first.
3. Implement the minimum component change required for GREEN.
4. Keep ECharts lifecycle in `src/common`.
5. Run focused tests, then `verify:full`.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_components-plan.md`.
