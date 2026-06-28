---
name: code-health
description: Use for KMSF lint, typecheck, syntax checks, refactor assessment, memory/performance risk review, and focused cleanup proposals. Do not perform PR-style review or run Playwright/Vitest gates when test-gate is the better match.
---

# Code Health

## Scope

- Syntax, lint, and typecheck failures.
- Refactor candidates that reduce real complexity.
- Memory, cleanup, lifecycle, listener, timer, and render-loop risks.
- Package compatibility checks such as peer dependency and SSR import safety.

## Workflow

1. MUST: Identify the smallest affected scope.
2. MUST: Prefer existing package or app verification commands.
3. MUST: Separate confirmed defects from improvement candidates.
4. MUST: Keep refactors scoped to the request.
5. REPORT: commands and residual risks in the nearest `reports/YYYY-MM-DD.md`.
