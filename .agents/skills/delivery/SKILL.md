---
name: delivery
description: Use for KMSF delivery coordination when a task touches UI, auth, docs, verification, reporting, or release readiness. Routes to narrower KMSF skills; do not use for generic code review, markdown-only cleanup, or test execution when a narrower skill applies.
---

# Delivery

## Role

Use this as the thin KMSF delivery router. Keep decisions local to the current task and prefer narrower skills when they match.

## Route

- Code review or PR/local diff review: use `code-review`.
- Research, external/current information lookup, official docs comparison, or pre-plan investigation: use global `ask-research`.
- Plan, implementation review, implementation plan, or new implementation files with unresolved supervisor decisions: use `ask-question`.
- AGENTS, GUIDE, docs/codex, or report policy cleanup: use `update-md`.
- README alignment with implemented features, scripts, exports, or scaffold behavior: use `update-readme`.
- Lint/typecheck/refactor/performance or memory-risk audit: use `code-health`.
- Vitest, Playwright, verify, or browser gate execution: use `test-gate`.

## KMSF Rules

1. MUST: Use this repository's Git root as the work root.
2. Read the nearest active `AGENTS.md` before editing.
3. MUST: Keep the Next.js App Router structure for `apps/kmsf`.
4. MUST: Keep reusable packages generic React-compatible and free of Next.js-only runtime APIs.
5. REPORT: work results in the nearest scope `reports/YYYY-MM-DD.md`.
