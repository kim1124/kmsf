# @kmsf/gridstack Test Rules

## Scope

This file applies to `packages/gridstack/test`.

## Role

The test workspace owns package-local Vitest, Playwright, browser artifacts, and work report routing.

## Rules

- MUST: Vitest tests under `test/vitest`.
- MUST: Playwright specs under `test/playwright/specs`.
- MUST: new package work reports under `packages/gridstack/reports/YYYY-MM-DD.md`.
- DO NOT: leave active artifacts under repository root `test-results`.
- REPORT: skipped browser checks with the reason and remaining risk.
- Prefer focused tests before package baseline verification.
- MUST: For behavior changes, write or update the smallest failing test before production code unless the change is documentation-only or instruction-only.

## Verification Routing

- RUN: `npm --workspace=@kmsf/gridstack run test:run` for pure state, helper, scheduler, option mapping, and structural guardrail tests.
- RUN: `npm --workspace=@kmsf/gridstack run test:e2e` for rendered UI, example, drag, resize, maximize, minimize, responsive, or browser console behavior.
- RUN: `npm --workspace=@kmsf/gridstack run verify` for package baseline.
- RUN: `npm --workspace=@kmsf/gridstack run verify:full` before completion when browser-visible package behavior changes.
