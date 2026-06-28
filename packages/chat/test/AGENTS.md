# @kmsf/chat Test Rules

## Scope

`test` contains package Vitest and Playwright tests.

## Test Matrix

- Core state and validation: Vitest.
- Ollama stream parsing and abort behavior: Vitest with fake `fetch`.
- Local setup and chat storage: Vitest with fake `StorageLike`.
- Supabase adapter behavior: Vitest with fake client chains.
- Supabase SQL contract: Vitest reading package migration SQL.
- Rendered setup, settings, chat, errors, and responsive layout: Playwright.

## TDD Evidence

- Every production behavior change starts with a failing focused test.
- REPORT: expected RED reason and final GREEN command in `packages/chat/reports/YYYY-MM-DD.md`.
- DO NOT: mark a task complete if the relevant focused test or package baseline fails.

## Browser Evidence

For rendered UI, record the route, viewport, command, and visible behavior checked.
