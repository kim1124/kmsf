# Example Memory

## 2026-06-09

- Decision: example navigation uses React Router hash routes for chart pages and direct example focus routes.
- Decision: renderable chart types expose exactly 5 card examples.
- Decision: global search uses static index data and must not instantiate inactive chart cards or ECharts instances.
- Decision: right docs search is scoped to the active chart document.
- Decision: charts GridStack page keeps generated-data popup validation separate from widget creation.

## 2026-05-02

- Decision: example UX combines chart menu, sample data, usage code, and rendered chart stage.
- Decision: example remains Vite/React compatible and must not use Next.js-only APIs.
- Decision: nonblank canvas and console error checks remain browser Gate requirements.
