---
name: test-gate
description: Use for KMSF Vitest, Playwright, browser verification, package verify, app verify, and final test reporting. Select and run the smallest relevant gate first; do not refactor or broaden scope unless a failing test requires it.
---

# Test Gate

## Command Routing

- RUN: Root app baseline: `npm run verify`.
- RUN: Root app full browser gate: `npm run verify:full`.
- RUN: Package baseline: `npm --workspace=<package> run verify`.
- RUN: Package browser gate: `npm --workspace=<package> run verify:full`.
- RUN: Aggregate packages: `npm run verify:packages`.

## Browser Rules

1. VERIFY: UI, auth, routing, layout, and interaction changes require browser verification or Playwright coverage.
2. MUST: Prefer CLI Playwright for repeatable gates.
3. USE WHEN: Browser, Chrome, or Computer Use is needed for interactive visual investigation.
4. REPORT: if a check cannot run, record the blocker and residual risk in `reports/YYYY-MM-DD.md`.
5. REPORT: for E2E, browser, DB, or deploy checks, include command, pass/fail, failure cause, rerun result, and artifact path when available.
