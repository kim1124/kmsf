# @kmsf/charts Agent Map

## Scope

- SCOPE: `@kmsf/charts` package, `src`, `src/common`, `src/components`, `example`, `test`, `GUIDE.md`.
- CONTEXT: Root `AGENTS.md`의 공통 process, skill, completion, reporting rule을 상속한다.
- MUST: 세부 지식, 계획, 히스토리는 `docs/agents/README.md`를 따른다.
- MUST: 하위 규칙은 `src/common/AGENTS.md`, `src/components/AGENTS.md`, `test/AGENTS.md`, `example/AGENTS.md`를 따른다.

## Public Components

- MUST: Public components are `GenericChart`, `TrendChart`, `TopChart`, `SankeyChart`, `WordCloud`, `GaugeChart`, `SunburstChart`, `RadarChart`, `HeatmapChart`, `GraphChart`.
- DO NOT: Reintroduce misspelled `GuageChart` or `SunbustChart` public exports.

## Implementation Rules

- DO NOT: introduce Next.js-only APIs.
- MUST: Keep React and React DOM as peer dependencies.
- MUST: ECharts official option shapes where customization is exposed.
- MUST: Keep imperative ECharts lifecycle and updates in shared common modules.
- MUST: Use `ResizeObserver` or `requestAnimationFrame` for chart resize scheduling.
- AVOID: deep cloning large datasets in render paths.
- MUST: Treat 10,000+ points and repeated updates as baseline requirements.

## Data Rules

- MUST: `data` is required for all charts.
- MUST: `series` is required for `TrendChart`.
- MUST: Other charts generate at least one default series when `series` is omitted.
- Trend rows use index `0` as X and indexes `1..n` as values mapped to `series`.
- Top rows use index `0` as category and indexes `1..n` as values mapped to `series`.
- Time parsing accepts `YYYY-MM-DD HH:mm:ss` strings and `Date` objects.

## Verification Commands

- RUN: `npm --workspace=@kmsf/charts run verify` for package baseline: lint, Vitest, build.
- RUN: `npm --workspace=@kmsf/charts run verify:full` for package full gate: baseline plus Playwright.
- RUN: `npm run verify:packages` from repo root only when aggregate package verification is explicitly requested.

## Reporting

REPORT: Before closing substantial work, update `packages/charts/reports/YYYY-MM-DD.md` with timestamp, summary, changed files, commands actually run, pass/fail result, and residual risks.
