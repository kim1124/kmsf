# Example Plan

## Active Plan

1. Treat example changes as consumer-surface changes.
2. Keep imports on public package exports where practical.
3. Preserve Playwright labels and test ids unless tests are updated first.
4. Run Playwright for layout, chart visibility, interaction, or accessibility changes.
5. Run build when public API usage changes.

## 2026-05-26 Docs And Sample Page Plan

1. Add failing Playwright coverage for the docs/sample shell:
   - left chart-type aside can collapse and expand.
   - right floating docs aside contains a search input and Markdown-rendered required props.
   - option controls update rendered chart state.
   - trend data updates within about 1 second and top data updates within about 10 seconds.
2. Add failing Playwright coverage for a separate gridstack page:
   - page navigation works without a router dependency.
   - chart widgets can be added and removed.
   - repeated create/delete leaves no console errors and restores the expected canvas count.
3. Implement example-only UI primitives under `example/src/components/ui`.
   - Use shadcn-style `Button`, `Input`, `Card`, `Badge`, `Tabs`, `ScrollArea`, `Collapsible`, and `Sheet` APIs.
   - Keep components local to the example and avoid package runtime exports.
4. Move chart sample metadata into focused example modules.
   - `example/src/data/chart-samples.ts` owns supported chart samples and realtime data builders.
   - `example/src/docs/chart-docs.ts` owns Markdown docs, required props, search terms, and official links.
5. Rebuild `example/src/App.tsx` as a two-page sample app.
   - Main page: collapsible left aside, central chart sample, right floating docs aside.
   - Gridstack page: dynamic `@kmsf/gridstack` dashboard with chart widgets.
6. Update `example/src/styles.css` for KMSF dashboard styling.
   - Use KMSF CSS tokens where available and keep fallback colors aligned to the current mint style.
7. Run focused tests first, then `npm --workspace=@kmsf/charts run verify:full`.
8. Update `reports/2026-05-26.md` with files, commands, result, and residual risks.

## 2026-05-27 Example Improvement Plan

### Goal

Improve the chart example page so every sample renders with clear chart identity, stable color distinction, live editable data/options, reliable tooltip behavior, zero browser warnings/errors, and stable GridStack resize behavior.

### Scope

- Main charts example under `packages/charts/example`.
- Common chart option helpers under `packages/charts/src/common` only where example defects expose incorrect shared defaults.
- `packages/gridstack` adapter fix is required for the reported resize stop error. This is outside the charts package write scope and must be handled as a coordinated package change before the charts example can honestly claim the GridStack resize error is fixed.

### Confirmed Implementation Direction

1. Prefer deterministic KMSF-aligned colors over random colors.
   - Add a 10-color palette derived from current KMSF mint/lime/sky/orange/violet/red direction.
   - Use the palette as `themeOverrides.palette` for series-level coloring.
   - For item/category charts, apply `itemStyle.color` by `dataIndex % palette.length`.
   - For wordCloud, apply `textStyle.color` from the same palette.
   - For TOP examples, build up to 50 items and map each item to a palette slot.
2. Fix tooltip defaults by chart behavior.
   - Axis/trend charts default to `trigger: "axis"`.
   - Item/native charts such as `sankey`, `graph`, `pie`, `treemap`, `sunburst`, `funnel`, `gauge`, and `wordCloud` default to `trigger: "item"`.
   - User-provided tooltip object keeps precedence, but if no `trigger` is provided, the chart-specific default is inserted.
3. Remove ambiguous format/category badges from the content header.
   - Replace duplicate-looking tags such as `trend`/`Trend` and `top`/`Top` with a single one-line chart description.
   - Keep format information in the Data/Options panels or docs, not in the visual header.
4. Rebuild left navigation metadata.
   - `ChartSample.summary` should describe the chart in one sentence, not show the `data` tuple format.
   - Add a `chartIconByType` map using `lucide-react` icons.
   - Expanded menu shows icon, chart name, and one-line chart description.
   - Collapsed menu shows icon-only buttons with `aria-label` and tooltip/title; no title text should be allowed to overflow.
5. Add live data/options editing.
   - Add JSON editors for `data` and safe option patches.
   - Apply changes immediately after valid JSON parsing, using a small debounce to avoid render churn.
   - Add a full data refresh button that resets the current chart data from the sample generator.
   - Reject unsupported top-level patch keys and invalid data shapes before passing them to ECharts.
   - Show `허용되지 않는 옵션입니다.` in the chart viewport top-left when validation fails. JSON parse errors should show a parse-specific message so users can distinguish syntax from policy rejection.
6. Resolve `alignTicks` warning as a hard failure.
   - First add Playwright warning capture that records the selected chart type for every warning.
   - Reproduce the exact emitting chart.
   - Remove the conflicting option at the source. If the source is an example axis option, set `alignTicks: false` or replace fixed `min`/`max` with data-driven limits where possible. If the source is a generic helper merge, normalize axis options to prevent fixed `min`/`max` plus `alignTicks: true`.
7. Change trend legend marker to a filled circle.
   - Apply `legend: { icon: "circle" }` for `TrendChart` and Generic trend line examples.
   - Keep this scoped to trend/line behavior unless other chart families explicitly need it.
8. Fix GridStack resize stop error in `@kmsf/gridstack`.
   - Stop committing React layout state from the `change` event during active drag/resize.
   - Track `dragstart`/`resizestart` and `dragstop`/`resizestop` in the adapter.
   - Buffer layout changes during interaction and commit once after GridStack's own stop handler completes.
   - Prevent `adapter.sync()` from calling `grid.update()`, `grid.column()`, `makeWidget()`, or `removeWidget()` while GridStack has an active drag/resize node.

### Task Plan

1. Add focused failing tests for diagnostics.
   - Modify `test/playwright/specs/example.spec.ts`.
   - Replace `collectBrowserErrors` with a diagnostics collector that captures `warning`, `error`, and `pageerror`.
   - Update canvas pixel checks to avoid `getImageData` readback warnings.
   - Add tests for Sankey tooltip, collapsed icon-only navigation, manual data refresh, invalid option overlay, and warning-free chart switching.
2. Add focused failing tests for option and palette helpers.
   - Modify or add Vitest coverage under `test/vitest`.
   - Assert chart-specific tooltip trigger selection.
   - Assert TOP item color mapping uses the same deterministic palette for pie, wordCloud, and axis TOP charts.
   - Assert invalid live option keys are rejected before ECharts receives them.
3. Implement palette and sample metadata cleanup.
   - Add example-local helpers under `example/src/data`.
   - Expand TOP sample data where appropriate to 50 rows.
   - Update chart summaries to one-line chart descriptions.
   - Remove duplicate format/category badges from the main chart header.
4. Implement icon-only collapsed navigation.
   - Modify `example/src/App.tsx` and `example/src/styles.css`.
   - Add a chart type to icon mapping.
   - Keep expanded and collapsed navigation accessible with `aria-label`, `title`, and stable button dimensions.
5. Implement live data/options editing.
   - Add local editor UI components if needed, for example a textarea primitive under `example/src/components/ui`.
   - Keep editor state separate from generated sample state.
   - Apply valid edits immediately and show validation errors inside the chart viewport.
   - Add a full data refresh button that regenerates all data for the selected chart and resets invalid state.
6. Fix shared tooltip default behavior.
   - Modify `src/common/generic-chart.ts` or `src/common/options.ts` with the smallest shared API change.
   - Keep user-provided tooltip objects higher precedence than inferred defaults.
7. Fix trend legend circle behavior.
   - Apply the legend circle default in the trend-specific path and update sample option summary expectations.
8. Fix `alignTicks` warning.
   - Use the new diagnostics test to locate the emitting chart.
   - Patch only the source option that emits the warning.
   - Keep all browser warnings as test failures.
9. Fix GridStack resize interaction.
   - Coordinate a package change in `packages/gridstack/src/gridstack/adapter.ts`.
   - Add GridStack Playwright coverage that resizes a widget repeatedly and asserts no console warning/error/pageerror.
   - Re-run the charts gridstack example after the gridstack package fix.
10. Run verification in increasing scope.
    - Focused Vitest for helper behavior.
    - Focused Playwright for example navigation, tooltip, editor, and gridstack resize.
    - `npm --workspace=@kmsf/charts run verify:full`.
    - `npm --workspace=@kmsf/gridstack run verify:full` if the adapter is changed.
11. Update reports.
    - Update `packages/charts/reports/YYYY-MM-DD.md`.
    - If GridStack is changed, also update `packages/gridstack/reports/YYYY-MM-DD.md`.

### Acceptance Criteria

- No browser `warning`, `error`, or `pageerror` remains in the chart example tests.
- Sankey tooltip appears when tooltip is enabled.
- TOP item charts and wordCloud use deterministic KMSF-aligned color mapping.
- Series-level charts have visually distinguishable series colors.
- Content header no longer shows ambiguous duplicate format/category badges.
- Collapsed left navigation renders icon-only controls without broken title text.
- Manual data refresh changes the selected chart data immediately.
- Valid data/options edits apply immediately.
- Invalid option edits show `허용되지 않는 옵션입니다.` without breaking the chart.
- `alignTicks` warning is removed at source.
- Trend legend marker is a filled circle.
- GridStack widget resize no longer throws `Cannot read properties of undefined (reading 'w')`.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_example-plan.md`.
