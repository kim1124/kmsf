# @kmsf/chat Root Research

## Verified Repo Facts

- The KMSF monorepo uses npm workspaces for `apps/*`, `examples/*`, and `packages/*`.
- Existing React packages under `packages/*` use Vite library builds, React peer dependencies, Vitest logic tests, and Playwright browser tests.
- Existing package examples keep shadcn configuration close to the example app through `components.json`.
- `lucide-react` is already used by package workspaces.
- `apps/kmsf` has an initial setup route at `apps/kmsf/src/app/setup/initial-admin/page.tsx`; it is a reference for setup flow, not a dependency for `@kmsf/chat`.

## External References Checked

- Ollama API default base path is documented as `http://localhost:11434/api`.
- Ollama chat endpoint is `POST /api/chat`, accepts `model`, `messages`, and streams by default.
- Ollama model list endpoint is `GET /api/tags`.
- Supabase RLS docs require RLS on tables in exposed schemas and recommend explicit role-scoped policies.
- Supabase RLS docs recommend indexing policy columns and wrapping helper calls such as `auth.uid()` with `select` in policies.

## Supervisor Decisions

- Package name and path: `@kmsf/chat` under `packages/chat`.
- Package independence: do not couple implementation to `apps/kmsf`.
- Integration posture: `apps/kmsf` can consume the package later through adapter props.
- Initial model behavior: local Ollama target, but no hard-coded model default.
- Model selection must be available on the chat initial/setup surface before the first prompt can be sent.
- Ollama model discovery failure allows manual model-name entry fallback.
- Storage posture: support local and Supabase.
- Supabase posture: consumer-provided Supabase client and user identity.
- Setup UX: initial setup page plus settings dialog plus embeddable settings page.
- Setup persistence: package local store by default, external store override supported.
- Instruction posture: separate package-level and domain-level `AGENTS.md` files from the beginning.

## Ask Gate

No unresolved supervisor decision blocks the TDD implementation plan.
The planned table names and exported type names are package implementation defaults and remain reviewable before production source is created.

## Residual Risks

- Live Ollama verification can fail if the local host denies browser access or Ollama CORS differs from the example runtime.
- Supabase migration execution is not part of this planning step; SQL must be verified before applying to a real project.
- Package installation may require lockfile updates when implementation adds the workspace package and dependencies.
