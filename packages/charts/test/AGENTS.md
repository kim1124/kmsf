# @kmsf/charts Test Rules

## Scope

This file applies to `packages/charts/test`.

## Role

The test workspace owns package-local Vitest, Playwright, browser artifacts, instruction contracts, and work report routing.

## Rules

- MUST: Vitest tests under `test/vitest`.
- MUST: Playwright specs under `test/playwright/specs`.
- MUST: new package work reports under `packages/charts/reports/YYYY-MM-DD.md`.
- DO NOT: leave active artifacts under repository root `test-results`.
- MUST: For behavior changes, write or update the smallest failing test before production code.
- REPORT: skipped browser checks with blocker and residual risk.
- MUST: instruction contract tests aligned with `AGENTS.md`, `GUIDE.md`, `README.md`, and tracked `docs/`.

## Canvas Layer Classification

Canvas count checks apply to every implemented chart type, not only `line` or `lines`.

- CHECK: canvases per rendered chart card first, then aggregate page-level totals.
- EXPECT: If the page renders 3 chart cards and no chart is explicitly allow-listed for multi-layer rendering, the expected main canvas count is 3.
- EXPECT: A chart card normally owns exactly one visible, non-zero, painted primary canvas.
- MUST: Multiple canvases in one chart card are allowed only when the chart type or option has an explicit ECharts/zrender reason, such as numeric `zlevel`, progressive or incremental rendering, hover layer, or documented effect layer behavior.
- REPORT: Any allowed multi-layer case must be documented in the Playwright helper or test fixture with the chart type, trigger option, expected layer ids, and source reference.
- MUST: `data-zr-dom-id="zr_undefined"` as abnormal unless a focused source inspection proves it is expected for the exact chart type and option set.
- MUST: growing canvas count after data update, resize, chart switch, or unmount as a lifecycle failure.
- MUST: duplicate canvases with the same size and no matching zrender layer metadata as suspect until classified.
- MUST: zero-size, hidden, blank, or stale canvases after stable render as failures.
- REPORT: Tests must record `canvasCount`, `paintedCanvasCount`, `zeroSizeCanvasCount`, `data-zr-dom-id` values, and zrender layer keys when available.
- VERIFY: Soak and browser diagnostics must verify that canvas counts remain stable across repeated updates for all supported chart types.

## Verification Routing

- RUN: `npm --workspace=@kmsf/charts run test:run` for pure helpers and structural guardrails.
- RUN: `npm --workspace=@kmsf/charts run test:e2e` for rendered chart or example changes.
- RUN: `npm --workspace=@kmsf/charts run verify` for package baseline.
- RUN: `npm --workspace=@kmsf/charts run verify:full` before completion when browser-visible package behavior changes.
