# @kmsf/charts Package Contract

## Purpose

This package provides React chart components for KMSF boilerplate consumers.

The package must work in generic React environments and must not depend on Next.js runtime APIs.

## Scope

- Package name: `@kmsf/charts`
- Runtime source: `src`
- Component source: `src/components`
- Shared chart engine and option helpers: `src/common`
- Package example: `example`
- Package-local verification artifacts: `test`

## Required Components

- `TrendChart`
- `TopChart`
- `SankeyChart`
- `WordCloud`
- `GuageChart`
- `SunbustChart`

Keep the requested exported names as written until the public API is agreed. If spelling changes are proposed later, document the compatibility plan before changing exports.

## Implementation Rules

- Do not introduce Next.js-only APIs.
- Keep React as a peer dependency.
- Use ECharts official option shapes where customization is exposed.
- Prefer small data normalization helpers over component-local parsing.
- Avoid deep cloning large datasets in render paths.
- Use imperative ECharts updates only through a shared engine module.
- Use requestAnimationFrame or ResizeObserver-based resize scheduling because ECharts is not responsive by default.
- Treat 10,000+ point rendering and repeated updates as baseline requirements.

## Data Rules

- `data` is required for all charts.
- `series` is required for `TrendChart`.
- Other charts must generate at least one default series when `series` is omitted.
- Trend data uses index `0` as the X value and indexes `1..n` as values mapped to `series` order.
- Top data uses index `0` as category and indexes `1..n` as values mapped to `series` order.
- Time parsing should accept `YYYY-MM-DD HH:mm:ss` strings and `Date` objects.

## Testing Rules

- Use Vitest for pure helpers, option builders, and update behavior.
- Use Playwright for rendered chart responsiveness, resize behavior, tooltip behavior, and visual interaction checks.
- Use package-local result folders:
  - `test/vitest`
  - `test/playwright`
  - `test/reports`
- Document any skipped browser check in `test/reports/YYYY-MM-DD.md`.

## Superpowers Guardrail

- Use Superpowers TDD for behavior changes after this initial scaffold.
- Documentation-only and instruction-only changes are TDD exceptions.
- For chart behavior implementation, write the smallest relevant Vitest or Playwright failing test before production code.

## Reporting

Before closing substantial package work, update `test/reports/YYYY-MM-DD.md` with:

- timestamp
- summary
- changed files
- commands actually run
- pass/fail result
- residual risks or blockers
