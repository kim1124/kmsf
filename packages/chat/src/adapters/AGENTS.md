# @kmsf/chat Adapter Rules

## Scope

`src/adapters` contains side-effect boundaries for Ollama, local browser storage, Supabase storage, and setup persistence.

## Rules

- MUST: adapters replaceable through explicit interfaces from `src/core`.
- Inject `fetch` into Ollama adapter tests; default to `globalThis.fetch` only in runtime factory code.
- MUST: Ollama requests scoped to the configured base URL; default value is `http://localhost:11434`.
- Parse Ollama streaming chunks incrementally and support abort through `AbortSignal`.
- MUST: local storage behind a `StorageLike` contract for deterministic tests.
- MUST: Supabase adapter receive a client-like object from the consumer and must not read env vars.
- MUST: Supabase adapter persist rows using the active `ChatUserIdentity.id`.
- MUST: Supabase SQL enable RLS on exposed tables and use authenticated-user ownership policies.
- DO NOT: expose or require a service-role key in browser code.

## TDD Gate

Adapter behavior must start with focused Vitest tests using fake `fetch`, fake `StorageLike`, or fake Supabase client chains before adapter implementation.
