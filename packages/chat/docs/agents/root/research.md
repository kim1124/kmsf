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

## 2026-06-18 Chat UI Redesign Research

### Repo Sources Checked

- `AGENTS.md`
- `src/components/AGENTS.md`
- `src/index.ts`
- `src/adapters/local/local-chat-store.ts`
- `docs/codex/06-design-style-guide.md`
- `docs/codex/07-package-style-contract.md`
- `apps/kmsf/src/lib/auth/providers/local-json-auth-store.ts`

### External Sources Checked

- Ollama chat API: https://docs.ollama.com/api/chat
- Ollama model list API: https://docs.ollama.com/api/tags
- shadcn/ui docs: https://ui.shadcn.com/docs
- shadcn/ui Tooltip docs: https://ui.shadcn.com/docs/components/tooltip

### Confirmed Facts

- `@kmsf/chat` must stay standalone and must not import `apps/kmsf` runtime code.
- Public exports are centralized through `src/index.ts`.
- Existing local chat persistence is browser `StorageLike` based.
- KMSF local DB pattern uses `lowdb` and `JSONFile` in the app server/runtime boundary.
- KMSF package style contract requires package-scoped CSS variables with fallback to `--kmsf-*` root tokens.
- Ollama official public API covers chat streaming and model listing, but not a stable conversation-history list endpoint.
- shadcn/ui does not provide a dedicated chat widget or floating chatbot component in the checked docs.

### Supervisor Decisions Accepted

- Use ChatGPT-like split layout as the fixed default.
- Do not use Ollama private or internal chat list endpoints.
- Keep Supabase in mind but defer Supabase persistence changes for this improvement.
- Use KMSF local DB approach through a package store boundary; do not import `apps/kmsf`.
- Do not add new shadcn/ui runtime dependency.
- Export the floating chatbot as `ChatFloatingButton`.
- Show floating chatbot only when Ollama setup has an effective model and chat can be submitted.
- Save one-time floating sessions when they close and place them at the top of the recent list.
- Use active floating button hover to communicate close/end behavior with an `X` icon.
- Exclude screenshots from this planning artifact.

### Ask Gate

Ask gate is clear for writing the design spec and implementation plan.
No unresolved supervisor-owned decision blocks the next implementation step.

### Residual Risks

- KMSF local DB integration requires a host app adapter or server boundary; package browser runtime cannot write a local lowdb file directly.
- Supabase-compatible contracts must remain stable even though Supabase changes are deferred.
- Browser-to-Ollama availability can vary by local CORS and network policy.
- Floating session save-on-close can lose unsaved messages if the tab or process exits before close.

## 2026-06-19 Chat Risk Follow-up Research

### Confirmed Facts

- `ChatHistoryStore` is the package boundary for local and Supabase chat persistence.
- Local chat persistence uses browser `StorageLike`; thread and message deletion can be implemented without a new dependency.
- Supabase storage remains consumer-provided and must not read environment variables or service-role keys.
- `ChatMessage` already supports `status: "error"` and an `error` field for assistant failure persistence.

### Supervisor Decisions Accepted

- Use explicit `deleteThread` and `deleteMessages` APIs on `ChatHistoryStore`.
- Show setup success as a status banner with `로컬 LLM 설정이 완료되었습니다.`, not as a toast.
- Persist chat response failures as assistant error messages so reload preserves the failed turn context.
- Keep live Ollama verification as optional local smoke outside the default automated gate.

### Ask Gate

Ask gate is clear for the 2026-06-19 follow-up implementation and documentation updates.

### Residual Risks

- Supabase real-project migration or project application remains outside this package task.
- Live Ollama browser behavior remains environment-dependent and is still covered only by optional local smoke.
- Existing dirty worktree entries must be preserved and not treated as rollback targets.
