# @kmsf/chat Core Rules

## Scope

`src/core` contains framework-free TypeScript for chat state, setup state, validation, errors, public contracts, and storage/provider interfaces.

## Rules

- DO NOT: import React, DOM APIs, browser storage, Ollama, Supabase, or package UI from this directory.
- MUST: functions deterministic and easy to test with Vitest.
- Model streaming as explicit state transitions: submit, assistant-start, assistant-delta, assistant-complete, assistant-error, abort.
- MUST: setup state independent from React components so the same rules work in a package example and host apps.
- Define public interfaces here before adapters or components consume them.
- MUST: user-owned data boundaries: package-owned `ChatUserIdentity` is an adapter contract, not an `apps/kmsf` session import.

## TDD Gate

Core behavior must start with a failing Vitest test under `test/vitest`.
Expected RED evidence and final GREEN evidence must be recorded in the work report.
