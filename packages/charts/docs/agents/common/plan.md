# Common Plan

## Active Plan

1. Add or update focused Vitest tests before changing common helpers.
2. Keep ECharts lifecycle changes inside `KmsfChart` or common helpers.
3. Confirm no Next.js runtime imports are introduced.
4. Run `npm --workspace=@kmsf/charts run test:run`.
5. Run `npm --workspace=@kmsf/charts run verify:full` before completion.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_common-plan.md`.
