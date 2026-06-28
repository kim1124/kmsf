# @kmsf/chat Example Rules

## Scope

`example` is the Vite-based package consumer example for local development and Playwright verification.

## Rules

- MUST: the package as a consumer would import it.
- MUST: the example independent from `apps/kmsf`.
- Provide a local-mode demo that can run without Supabase credentials.
- Provide a Supabase-mode UI path with a fake or consumer-provided client for test coverage.
- Mock Ollama in Playwright unless an explicit live Ollama verification task is requested.
- MUST: shadcn-compatible primitives local to the example when they are only needed for the demo shell.

## Verification

Use `npm --workspace=@kmsf/chat run dev` for local preview and `npm --workspace=@kmsf/chat run test:e2e` for browser coverage.
