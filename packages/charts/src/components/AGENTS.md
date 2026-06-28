# @kmsf/charts Component Rules

## Scope

This file applies to `packages/charts/src/components`.

## Role

The component layer owns public React chart components, props, aliases, chart-specific option assembly, and consumer-facing data contracts.

## Knowledge Map

- Research: `docs/agents/components/research.md`
- Plan: `docs/agents/components/plan.md`
- Memory: `docs/agents/components/memory.md`

## Rules

- DO NOT: introduce Next.js-only APIs.
- MUST: ECharts lifecycle and imperative updates through `src/common`.
- MUST: `GenericChart`, `TrendChart`, `TopChart`, `SankeyChart`, `WordCloud`, `GaugeChart`, `SunburstChart`, `RadarChart`, `HeatmapChart`, and `GraphChart` exports stable.
- DO NOT: reintroduce misspelled `GuageChart` or `SunbustChart` public exports.
- MUST: `data` required for every chart.
- MUST: `series` required for `TrendChart`.
- Generate at least one default series for supported non-Trend charts when `series` is omitted.
- Prefer small helpers over component-local parsing.
- DO NOT: hard-code example-only demo data in runtime components.

## Verification

- MUST: Vitest for public API, data contract, and option behavior.
- MUST: Playwright for rendered canvas, resize, tooltip, mode switching, and browser-visible changes.
