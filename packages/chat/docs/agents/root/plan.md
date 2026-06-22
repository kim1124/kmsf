# @kmsf/chat Root Plan

## Active Plan

- Design spec: `docs/superpowers/specs/2026-06-08-kmsf-chat-package-design.md`
- TDD implementation plan: `docs/superpowers/plans/2026-06-08-kmsf-chat-package-implementation.md`
- Chat UI redesign spec: `docs/superpowers/specs/2026-06-18-chat-ui-redesign-design.md`
- Chat UI redesign implementation plan: `docs/superpowers/plans/2026-06-18-chat-ui-redesign-implementation.md`
- Chat verification plan: `docs/superpowers/plans/2026-06-18-chat-verification-plan.md`
- Chat risk follow-up plan: `docs/superpowers/plans/2026-06-19-chat-risk-followup-plan.md`

## Decision State

Chat UI redesign implementation has been executed.
Ask gate is clear for the 2026-06-19 risk follow-up implementation because supervisor decisions are fixed for deletion contract, setup success feedback, and chat failure persistence.

## 2026-06-18 Chat UI Redesign Decisions

- Default layout is fixed as ChatGPT-like split layout.
- Ollama internal chat list/history endpoints are not used.
- Supabase persistence remains deferred.
- KMSF local DB integration is planned through a host-injected store boundary, not by importing `apps/kmsf` into package runtime.
- No new shadcn/ui runtime dependency is added.
- `ChatFloatingButton` is the public floating chatbot export.
- Floating chatbot is visible only when Ollama setup can submit chat with an effective model.
- Closed floating one-time sessions are saved as the most recent thread.
- Active floating button hover communicates close/end behavior with an `X` icon.
- Screenshots are excluded from this planning artifact.

## Residual Risk Follow-up

- Supervisor decision on 2026-06-18 and normalized on 2026-06-19: live Ollama verification is an optional local smoke separate from the default automated package gate.
- Supervisor decision on 2026-06-18: Supabase migration responsibility remains package SQL and contract-test coverage; applying it to a real project is a consumer operation.
- Supervisor decision on 2026-06-18: close-out scope is limited to `packages/chat` and required `@kmsf/chat` lockfile review; unrelated dirty worktree entries stay out of scope.

## Execution Policy

- Start implementation with package harness tests.
- Use RED-GREEN-REFACTOR for every behavior task.
- Keep changes isolated to `packages/chat` unless the supervisor explicitly approves root workspace or consumer app edits.
- Do not commit, push, or create PRs without explicit supervisor approval.

## 2026-06-18 Verification Decisions

- Initial setup success should display user-visible success feedback.
- Local LLM failure verification includes both model discovery failure and chat response failure.
- Chat list deletion is permanent; restore/undo is out of scope.
- Live Ollama verification is an optional local smoke and is separate from the default automated package gate.

## 2026-06-19 Risk Follow-up Decisions

- Initial setup success feedback is a package-styled status banner, not a toast.
- `ChatHistoryStore` exposes explicit `deleteThread` and `deleteMessages` methods.
- Chat response failures persist an assistant message with `status: "error"` and normalized `error` text.
- Active thread deletion returns the chat surface to the empty state.
