# Test Plan

## Active Plan

1. Write focused RED tests before changing behavior or guardrails.
2. Run the focused test and confirm the expected failure reason.
3. Implement the minimum change for GREEN.
4. Run `npm --workspace=@kmsf/charts run test:run`.
5. Run `npm --workspace=@kmsf/charts run test:e2e` when browser behavior changes.
6. Run `npm --workspace=@kmsf/charts run verify:full` before completion.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_test-plan.md`.
