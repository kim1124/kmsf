# Test Plan

## Active Plan

1. Write focused RED tests before changing behavior or guardrails.
2. Run the focused test and confirm the expected failure reason.
3. Implement the minimum change for GREEN.
4. Run `npm --workspace=@kmsf/charts run test:run`.
5. Run `npm --workspace=@kmsf/charts run test:e2e` when browser behavior changes.
6. Run `npm --workspace=@kmsf/charts run verify:full` before completion.

## Canvas Layer Test Rule

- Playwright chart rendering checks use the shared card-level canvas layer classifier.
- Do not replace card-level checks with loose page-level canvas ranges.
- If a chart needs multiple canvases, document the chart type, trigger option, expected layer ids, and source reference in the classifier allow-list before accepting it.
- `zr_undefined`, growing canvas counts, stale canvases after switch/unmount, blank canvases, and zero-size canvases remain failures.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_test-plan.md`.
