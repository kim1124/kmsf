# @kmsf/charts Common Rules

## Scope

This file applies to `packages/charts/src/common`.

## Role

The common layer owns ECharts lifecycle helpers, option builders, data builders, data normalization, formatters, theme options, and resize scheduling.

## Rules

- DO NOT: import Next.js APIs.
- DO NOT: import package example code.
- MUST: React usage limited to shared runtime components such as `KmsfChart`.
- MUST: imperative ECharts init, dispose, resize, and `setOption` paths centralized.
- MUST: `ResizeObserver` or `requestAnimationFrame` for resize scheduling.
- AVOID: deep cloning large datasets in render-adjacent paths.
- MUST: data normalization deterministic and easy to cover with Vitest.
- MUST: ECharts official option shapes when exposing customization.
- MUST: 10,000+ points and repeated updates as baseline requirements.

## Verification

- MUST: Vitest for normalizers, option builders, formatters, theme, and structural guardrails.
- RUN: focused tests first, then `npm --workspace=@kmsf/charts run verify:full`.
