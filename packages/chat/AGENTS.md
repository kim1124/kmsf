# @kmsf/chat Agent Map

## Scope

- SCOPE: `@kmsf/chat` package, `src`, `src/index.ts`, `example`, `test`, `packages/chat/reports`, `packages/chat/docs/superpowers`.
- CONTEXT: Root `AGENTS.md`의 common contract, TDD, completion gate, reporting rule을 상속한다.
- MUST: 하위 규칙은 `src/core/AGENTS.md`, `src/adapters/AGENTS.md`, `src/components/AGENTS.md`, `example/AGENTS.md`, `test/AGENTS.md`를 따른다.
- MUST: Package documentation starts at `README.md`; package-local work reports go under `packages/chat/reports/YYYY-MM-DD.md`.

## Confirmed Decisions

- CONTEXT: `@kmsf/chat` is standalone. `apps/kmsf` is a possible consumer, not an implementation dependency.
- CONTEXT: Initial LLM target is local Ollama.
- DO NOT: hard-code a default model. The initial chat/setup surface must require model selection from Ollama model discovery, host-provided model options, or manual entry fallback.
- EXPECT: If Ollama model discovery fails, manual model-name entry fallback is allowed.
- CONTEXT: Storage modes are local browser storage and Supabase with consumer-provided Supabase client and user identity.
- CONTEXT: Setup UX uses an initial setup page, settings dialog, embeddable settings page, and local store with external override.

## Implementation Rules

- DO NOT: import from `apps/kmsf`.
- DO NOT: create a package-owned Supabase environment reader or service-role client.
- MUST: Keep React and React DOM as peer dependencies.
- MUST: Keep public exports discoverable from `src/index.ts`.
- MUST: Keep Ollama base URL, model, storage mode, and setup store configurable through package props or provider options.
- MUST: Use shadcn-compatible component patterns and `lucide-react` icons.
- DO NOT: add Next.js-only APIs to runtime source.
- USE WHEN: production behavior, public API, state model, adapter, rendered UI, or verification changes require TDD.

## Verification Commands

- RUN: `npm --workspace=@kmsf/chat run lint` for TypeScript validation.
- RUN: `npm --workspace=@kmsf/chat run test:run` for Vitest logic and contract tests.
- RUN: `npm --workspace=@kmsf/chat run build` for package build.
- RUN: `npm --workspace=@kmsf/chat run test:e2e` for rendered UI and browser interaction.
- RUN: `npm --workspace=@kmsf/chat run verify` for package baseline.
- RUN: `npm --workspace=@kmsf/chat run verify:full` for baseline plus Playwright.

## Reporting

REPORT: Before closing substantial work, update `packages/chat/reports/YYYY-MM-DD.md` with timestamp, summary, changed files, commands actually run, pass/fail result, and residual risks.
