# Example Memory

## 2026-06-09

- Decision: example navigation uses React Router hash routes for chart pages and direct example focus routes.
- Decision: renderable chart types expose exactly 5 card examples.
- Decision: global search uses static index data and must not instantiate inactive chart cards or ECharts instances.
- Decision: right docs search is scoped to the active chart document.
- Decision: charts GridStack page keeps generated-data popup validation separate from widget creation.

## 2026-07-01

- Decision: ECharts official example alignment excludes `map` and `custom` examples for now.
- Decision: current KMSF chart examples are too complex; non-live chart examples should use one ECharts-like JSON text area that can edit data, options, series, seriesOptions, and colors together.
- Decision: live/realtime examples must not allow manual data editing. They may allow option editing only if the generated data remains owned by the live generator.
- Decision: official examples with external datasets should be converted into deterministic local fixtures, not runtime network fetches.
- Decision: mixed-series official examples belong in an Advanced section at the bottom of the chart category.
- Decision: align the playground examples/docs only. Do not change `GenericChart` runtime defaults in this pass.
- Decision: keep the current wordCloud example, but smooth data refresh so visual updates do not feel abruptly interrupted.
- Decision: skip the 1-hour soak for this pass; use package/browser verification instead.

## 2026-07-02

- Decision: chart pages should keep only meaningful examples, not a forced five-card count.
- Decision: add a separate theme page and add a top-nav theme select immediately to the left of the global chart search input.
- Decision: keep live examples for every chart type, normalize live update interval to 5 seconds, and inspect the update path so same-shape live updates do not visually remount or redraw abruptly.
- Decision: `/api/props` owns detailed chart-by-chart API docs grouped by `KMSF Props`, `ECharts Options`, `SeriesOptions`, and shared methods/utilities.
- Decision: top search must index API docs and navigate to the matching API section.
- Plan: `docs/agents/example/plans/2026-07-02-playground-example-polish-plan.md`.

## 2026-05-02

- Decision: example UX combines chart menu, sample data, usage code, and rendered chart stage.
- Decision: example remains Vite/React compatible and must not use Next.js-only APIs.
- Decision: nonblank canvas and console error checks remain browser Gate requirements.
