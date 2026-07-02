# Charts Playground Example Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each behavior change, and use superpowers:verification-before-completion before reporting completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve `@kmsf/charts` playground examples so the page is easier to understand, edit, search, theme, and verify without duplicate or misleading UI.

**Architecture:** Keep the changes in the `packages/charts` example app unless the live update animation requires a focused shared chart lifecycle fix. Example rendering stays under the docs playground shell, theme selection is global to the example app, and chart-specific API docs/search data are generated from static package-local metadata.

**Tech Stack:** Vite, React, React Router, ECharts 5.6, local shadcn-style UI primitives, Vitest, Playwright.

---

## Confirmed Supervisor Decisions

- Meaningful examples only: do not force five cards when variants are visually or technically duplicated.
- Add a separate theme page and also add a top-right theme select immediately to the left of the global search input.
- Keep live examples for all chart types, change live update interval to 5 seconds, and investigate smoother ECharts updates.
- API docs use the recommended structure: `/api/props` owns detailed chart-by-chart API documentation, while chart pages keep only short required native-option summaries and official links.
- Ask gate clear: no unresolved product or UX decision remains for this implementation plan.

## Files And Responsibilities

- Modify `example/src/App.tsx`
  - Add global theme state/select in top nav.
  - Add `/examples/theme` docs page/live example.
  - Reset `.docs-shell__content` scroll to top when the active route changes.
  - Expand `/api/props` rendering to chart-by-chart API sections.
- Modify `example/src/components/ChartExampleCard.tsx`
  - Remove chip rendering and color controls.
  - Replace toggle button labels/states.
  - Keep a single editable `Chart config JSON` textarea in the Props tab.
- Modify `example/src/components/ChartConfigEditor.tsx`
  - Increase editor height through class usage or CSS contract.
  - Keep live data locked while allowing generated live examples to render normally.
- Create `example/src/data/chart-themes.ts`
  - Define Basic, Dark, Skyblue, Mint, Gray, Orange chart theme presets modeled after `@kmsf/data-table` theme options.
  - Expose palette and display metadata only; do not use ECharts `theme` registration in this pass to avoid dispose/re-init on select changes.
- Modify `example/src/data/chart-examples.ts`
  - Replace “always five examples” with one to five meaningful examples.
  - Keep one live example per chart type.
  - Remove duplicated option/data/layout variants when they do not materially change chart output.
  - Use official fixture variants where available.
  - Set all live update intervals to 5 seconds.
- Modify `example/src/data/chart-search.ts`
  - Index API prop/option/seriesOptions entries and route matching results to `/api/props#...`.
- Modify `example/src/docs/chart-docs.ts`
  - Add structured API metadata grouped by chart type: `KMSF Props`, `ECharts Options`, `SeriesOptions`, `Methods/Utilities`.
  - Keep chart page docs concise and link detailed API items to `/api/props`.
- Modify `example/src/styles.css`
  - Add top theme select styles based on the data-table theme select.
  - Add top search input border while keeping the outer search wrapper borderless.
  - Add active mint/white toggle button styles.
  - Increase chart config textarea height and remove unused summary panel styles if no longer referenced.
- Modify `src/common/KmsfChart.tsx` only if RED tests confirm live updates are abrupt because `replaceMerge: ["series"]` is always used.
  - Preserve stale series cleanup when series count decreases.
  - Avoid `replaceMerge` for same-shape live updates so ECharts can animate data changes.
- Modify tests under `test/vitest` and `test/playwright/specs`.
  - Add RED coverage before production code.

## TDD Task Plan

### Task 1: Lock The Example Card UX Contract

**Files:**
- Test: `test/playwright/specs/docs-playground-routing.spec.ts`
- Test: `test/playwright/specs/example.spec.ts`
- Modify: `example/src/components/ChartExampleCard.tsx`
- Modify: `example/src/components/ChartConfigEditor.tsx`
- Modify: `example/src/styles.css`

- [ ] Write failing Playwright coverage on `/examples/heatmap` or `/examples/tree`:
  - Props tab contains exactly one textbox named `Chart config JSON`.
  - The textarea height is at least `360px`.
  - `sample-data` and `option-summary` are not rendered.
  - No color picker or `색상 변경` button is rendered.
  - No `.chart-example-card__tags` content is rendered.
  - Buttons show `범례 표시` or `범례 숨김`, and `툴팁 표시` or `툴팁 숨김`.
  - Active button has mint background and inactive button has white background.
- [ ] Run the focused Playwright test and confirm it fails for the current UI.
- [ ] Remove chip output, color button, color input, `applyAccentColor`, and summary `<pre>` blocks from `ChartExampleCard`.
- [ ] Increase the `ChartConfigEditor` textarea height through CSS, scoped to chart config editors.
- [ ] Add `data-state="on|off"` or equivalent class to legend/tooltip buttons so active styles are testable and accessible.
- [ ] Run the focused Playwright test and confirm it passes.

### Task 2: Add Global Theme Selection Without Chart Reinitialization

**Files:**
- Create: `example/src/data/chart-themes.ts`
- Modify: `example/src/App.tsx`
- Modify: `example/src/components/ChartExampleCard.tsx`
- Modify: `example/src/styles.css`
- Test: `test/vitest/example-themes.test.ts`
- Test: `test/playwright/specs/docs-playground-routing.spec.ts`

- [ ] Write failing Vitest coverage:
  - theme list contains `basic`, `dark`, `skyblue`, `mint`, `gray`, `orange`.
  - every theme has a non-empty `palette`.
  - `mint` palette starts with KMSF mint family colors.
- [ ] Write failing Playwright coverage:
  - top nav has a select named `차트 테마 선택` immediately before the global search textbox.
  - selecting another theme keeps the current route and canvas visible.
  - selecting another theme does not emit browser `warning`, `error`, or `pageerror`.
- [ ] Implement `chart-themes.ts` with data-table-aligned preset labels.
- [ ] Add top nav select state in `ChartsDocsShell` or a small example-local context.
- [ ] Pass the selected theme palette into chart cards through `themeOverrides.palette` and `colors`.
- [ ] Do not pass selected presets into the `theme` prop. ECharts `theme` changes currently trigger `dispose()` and `echarts.init()` in `KmsfChart`.
- [ ] Add `/examples/theme` page showing several chart examples under the selected global theme.
- [ ] Run focused Vitest and Playwright.

### Task 3: Replace Forced Five Examples With Meaningful Examples

**Files:**
- Modify: `example/src/data/chart-examples.ts`
- Modify: `example/src/data/official-chart-fixtures.ts` if a missing official fixture is needed.
- Modify: `test/vitest/example-groups.test.ts`
- Modify: `test/playwright/specs/example.spec.ts`

- [ ] Replace the existing Vitest rule `renderable chart types expose exactly five examples` with:
  - every renderable chart type has at least 1 and at most 5 examples.
  - every renderable chart type has exactly one live example.
  - every non-live example has a distinct title and materially distinct option/series/data signature within its chart type.
- [ ] Add chart-specific expectations for known single-series structural charts:
  - `sunburst`, `tree`, `sankey`, `parallel`, `themeRiver`, `gauge`, `wordCloud` must not duplicate static variants with the same visible layout.
- [ ] Run Vitest and confirm failure.
- [ ] Refactor `createExamples` to build examples from selected official fixtures plus one live example, rather than always returning five cards.
- [ ] Keep official fixture examples where available and remove low-value generated `옵션 변형`, `데이터 변형`, `레이아웃 변형` cards when they do not visibly differ.
- [ ] Keep live examples for all chart types.
- [ ] Run focused Vitest and chart rendering Playwright.

### Task 4: Normalize Live Update Interval And Smooth Updates

**Files:**
- Modify: `example/src/data/chart-examples.ts`
- Modify: `src/common/KmsfChart.tsx` if required by failing tests.
- Modify: `test/vitest/example-groups.test.ts`
- Modify: `test/vitest/kmsf-chart.test.ts`
- Modify: `test/playwright/specs/example.spec.ts`

- [ ] Write failing Vitest coverage:
  - every live example has `updateIntervalMs === 5000`.
  - same-shape chart updates do not request `replaceMerge: ["series"]`.
  - series-count-decrease updates still request `replaceMerge: ["series"]`.
- [ ] Run Vitest and confirm failure.
- [ ] Change all live interval resolution to 5 seconds.
- [ ] Add stable `id` values to live series builders where missing.
- [ ] If `KmsfChart` is confirmed as the abrupt update source, change setOption option selection to compare previous and next series shape:
  - same length and compatible series `id`/`type`: `{ lazyUpdate: true }`
  - fewer series or incompatible shape: `{ lazyUpdate: true, replaceMerge: ["series"] }`
- [ ] Keep `dispose()` only on mount/unmount or actual ECharts theme prop changes.
- [ ] Run focused Vitest and Playwright diagnostics.

### Task 5: Expand API Docs And Global Search Index

**Files:**
- Modify: `example/src/docs/chart-docs.ts`
- Modify: `example/src/data/chart-search.ts`
- Modify: `example/src/App.tsx`
- Modify: `test/vitest/example-docs.test.ts`
- Modify: `test/vitest/example-search.test.ts`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`

- [ ] Write failing Vitest coverage:
  - every visible chart type has API sections for `KMSF Props`, `ECharts Options`, `SeriesOptions`.
  - native-required chart types list required native options in `ECharts Options`.
  - `searchCharts("seriesOptions")` returns an API result that navigates to `/api/props#...`.
  - `searchCharts("visualMap")` returns the heatmap API or option result.
- [ ] Write failing Playwright coverage:
  - `/api/props` shows chart-by-chart sections.
  - using the top-right search for `visualMap` shows an API/option result.
  - selecting the result navigates to the API page and focuses the matching section.
- [ ] Implement structured API metadata in `chart-docs.ts`.
- [ ] Render API sections with stable ids in `ChartsApiReference`.
- [ ] Extend `chart-search.ts` with API search items and path targets.
- [ ] Keep chart type pages concise: summary, required native options, official docs links, examples.
- [ ] Run focused Vitest and Playwright.

### Task 6: Reset Content Scroll On Route Change

**Files:**
- Modify: `example/src/App.tsx`
- Test: `test/playwright/specs/docs-playground-routing.spec.ts`

- [ ] Write failing Playwright coverage:
  - navigate to `/examples/heatmap`.
  - scroll `.docs-shell__content` down.
  - click a different sidebar chart page.
  - assert `.docs-shell__content.scrollTop === 0`.
- [ ] Implement a route-change effect in `ChartsDocsShell` or `RouteLifecycleBoundary` that scrolls the content element to top.
- [ ] Run focused Playwright.

### Task 7: Restore Top Search Input Border

**Files:**
- Modify: `example/src/styles.css`
- Test: `test/playwright/specs/example.spec.ts`

- [ ] Update existing top search Playwright coverage:
  - `.docs-topnav .example-search` remains borderless.
  - `.docs-topnav .example-search .ui-input` has `border-top-width: 1px`.
  - search stays inside the top bar and keeps the 15px right gap.
- [ ] Update CSS so only the input has a border; do not restore the wrapper/card border.
- [ ] Run focused Playwright.

### Task 8: Verification And Reporting

**Files:**
- Modify: `reports/2026-07-02.md`

- [ ] Run focused Vitest commands added by the tasks.
- [ ] Run focused Playwright commands added by the tasks.
- [ ] Run `npm --workspace=@kmsf/charts run lint`.
- [ ] Run `npm --workspace=@kmsf/charts run test:run`.
- [ ] Run `npm --workspace=@kmsf/charts run build`.
- [ ] Run `npm --workspace=@kmsf/charts run test:e2e` if focused gates pass.
- [ ] If the common `KmsfChart` update strategy changed, run `npm --workspace=@kmsf/charts run verify:full`.
- [ ] Update `reports/2026-07-02.md` with exact commands, pass/fail status, changed files, and residual risks.

## Acceptance Criteria

- Props tab shows one large `Chart config JSON` textarea and no duplicate summary panes.
- Color change controls are removed from chart example cards.
- Legend and tooltip buttons communicate current state through text and mint/white styling.
- Example card chips are removed.
- Each chart page shows only meaningful examples, with one live example retained.
- All live examples update every 5 seconds.
- Live chart updates do not dispose/reinitialize chart instances or visually reset when a same-shape data update is sufficient.
- Theme select appears to the left of global search and updates chart palettes without changing route.
- `/examples/theme` exists and demonstrates chart theming.
- `/api/props` documents chart-by-chart `KMSF Props`, `ECharts Options`, `SeriesOptions`, and shared methods/utilities.
- Top-right search indexes API docs and can navigate to matching API sections.
- Chart route changes reset content scroll to the top.
- Top search wrapper remains borderless, while the input itself has a visible border.
- Browser diagnostics remain free of unexpected warnings, errors, and page errors.
