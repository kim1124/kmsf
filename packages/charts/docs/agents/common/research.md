# Common Research

## Reviewed Findings

- `src/common` owns shared ECharts lifecycle, option, data, formatter, theme, and resize behavior.
- ECharts is not responsive by default, so resize scheduling must be explicit.
- Large data rendering requires avoiding deep clones in render-adjacent paths.

## High-Confidence Scope

- Vitest is the primary gate for normalizers and option builders.
- Browser behavior still needs Playwright when resize or canvas rendering changes.
