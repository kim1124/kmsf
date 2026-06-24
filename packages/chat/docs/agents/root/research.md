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

## 2026-06-23 Sidebar Visibility Research

### Scope

- User reported that the chat menu is still hidden at the minimum sidebar size.
- User requested ChatGPT UI comparison before planning the fix.

### Repo Sources Checked

- `src/components/ChatShell.tsx`
- `src/components/ChatSidebar.tsx`
- `src/core/sidebar-preferences.ts`
- `src/styles/_layout.scss`
- `src/styles/_sidebar.scss`
- `src/styles/_thread-list.scss`
- `test/playwright/specs/chat.spec.ts`

### External Sources Checked

- `https://chatgpt.com/`
- `https://help.openai.com/en/articles/12143177-sharepoint-connectors-on-chatgpt`
- Secondary source checked for sidebar shortcut context: Tom's Guide article on ChatGPT keyboard shortcuts.

### Confirmed Repo Facts

- Sidebar width currently persists with `kmsf.chat.sidebar.width`.
- Width contract is default `300px`, minimum `200px`, maximum `35%` viewport width.
- `.kmsf-chat-shell` uses columns `var(--kmsf-chat-sidebar-width) 6px minmax(0, 1fr)`.
- `.kmsf-chat-sidebar` has `padding: 14px`, so a 200px sidebar leaves about 172px inner content width.
- `.kmsf-chat-thread-select` always reserves `padding-right: 88px` for hover actions.
- At the 200px minimum, the thread title text therefore has about 84px or less usable text width before action reservation.
- `.kmsf-chat-thread-actions` is hidden until hover/focus, but the reserved right padding still reduces visible title space even when actions are hidden.
- The existing Playwright coverage verifies row/select width, resize persistence, and action overlay position, but it does not verify that a title remains meaningfully visible at the 200px minimum.

### External Facts

- The public ChatGPT page exposes sidebar-like navigation entries including `New chat`, `Search chats`, `Chat history`, `Settings`, and `Help`.
- The checked OpenAI Help Center article includes ChatGPT screenshots but does not provide a machine-readable layout contract for sidebar minimum width.
- A secondary keyboard-shortcut article reports that ChatGPT supports a sidebar toggle shortcut, which indicates the product treats sidebar visibility as a distinct state rather than only as a very narrow squeezed list.

### Root Cause Hypothesis

- The reported hiding is likely caused by the fixed `88px` action padding inside a 200px sidebar, combined with sidebar padding.
- The hover actions are visually floating, but the text layout still permanently reserves their full width.
- This makes the item technically full-width while the usable title text area becomes too small at the minimum width.

### Recommended Fix Direction

- Keep the requested minimum sidebar width at `200px`, but change the thread row layout so action reservation is responsive.
- At narrow sidebar widths, reserve less permanent right padding while keeping edit/delete buttons absolutely positioned at the right edge on hover/focus.
- Add a browser regression that sets sidebar width to `200px` and asserts:
  - the thread row stays inside the sidebar bounds,
  - visible title text area is not collapsed by action padding,
  - actions remain on the right edge on hover/focus,
  - the active thread remains mint background with white text.

### Unresolved Decisions

- No new supervisor-owned product decision is required if the fix keeps the existing 200px minimum, right-edge hover actions, and ellipsis behavior.
- If the minimum width itself should increase beyond 200px, that needs supervisor confirmation before implementation.

## 2026-06-24 Chat Sidebar Polish Research

### Scope

- User reported four follow-up polish issues after the sidebar minimum-width fix:
  - thread title ellipsis starts too early,
  - active thread title appears to disappear,
  - thread selection can feel sluggish while messages load,
  - hover edit/delete actions need cleaner styling.
- User requested ChatGPT GUI comparison, shadcn-compatible loading review, decision questions, and implementation planning.

### Repo Sources Checked

- `AGENTS.md`
- `src/components/AGENTS.md`
- `test/AGENTS.md`
- `src/components/ChatShell.tsx`
- `src/components/ChatSidebar.tsx`
- `src/core/types.ts`
- `src/styles/_layout.scss`
- `src/styles/_thread-list.scss`
- `test/playwright/specs/chat.spec.ts`

### External Sources Checked

- `https://chatgpt.com/`
- `https://help.openai.com/en/articles/12143177-sharepoint-connectors-on-chatgpt`
- Context7 shadcn/ui docs for Skeleton and Spinner loading patterns.

### Confirmed Repo Facts

- Thread item action buttons are absolutely positioned and hidden until row hover/focus.
- `.kmsf-chat-thread-select` currently reserves `padding-right: clamp(36px, 24%, 48px)` even when actions are not visible.
- Active row background is applied to `.kmsf-chat-thread-row[data-active="true"]`, but the nested `.kmsf-chat-thread-select` still inherits the shared button surface background unless explicitly overridden.
- Active thread text color is white/accent-foreground, so a surface background on the active button can create a white-on-white visual bug.
- `selectThread()` loads uncached messages with `historyStore.loadMessages(threadId)` and only updates state after the load resolves.
- There is no `loadingThreadId`, `aria-busy`, main-content overlay, spinner, or interaction-blocking layer during thread message loading.
- Hover action buttons currently inherit common button border styles from the package button token.
- `--kmsf-chat-danger` is available as a package token and can be used for delete action emphasis without adding a direct hex value.

### External Facts

- The public ChatGPT page exposes sidebar-like entries including `New chat`, `Search chats`, `Chat history`, `Settings`, and `Help`.
- OpenAI Help screenshots show ChatGPT UI context but do not expose a machine-readable CSS contract for sidebar item action spacing or loading behavior.
- shadcn/ui documents a `Skeleton` component for loading placeholders.
- shadcn/ui examples also show `Spinner` composition with disabled/pending UI. There is no requirement to add a runtime dependency because the package can implement a shadcn-compatible local spinner style with existing CSS and icons/tokens.

### Supervisor Decisions Accepted

- Normal thread item right reserve should shrink to `5px`.
- On hover/focus, the thread item should dynamically increase right reserve by the action button group width so title text does not permanently ellipsize too early.
- Main content only should be blocked while a thread is being loaded.
- Use spinner overlay for the loading UI.
- Hover action style should follow the recommended option:
  - remove action button borders,
  - edit action stays neutral,
  - delete action uses a red icon,
  - delete hover uses a red soft background.

### Ask Gate

Ask gate is clear for the sidebar polish implementation plan.
No unresolved supervisor-owned decision blocks the next implementation step.

### Residual Risks

- CSS cannot automatically measure an arbitrary future action-button group width without layout scripting or newer container/query features. The implementation should use package CSS variables derived from the current two-icon action group width and keep those variables customizable.
- Main-only blocking leaves the sidebar available during message loading. The implementation should guard against stale async `loadMessages()` results if the user selects another thread quickly.
- ChatGPT exact spacing and loading internals are not public; implementation follows observable GUI behavior and package-local KMSF style tokens.

## 2026-06-24 Floating Chatbot Panel Gap Research

### Scope

- User reported that in chatbot mode the dialog opens above the floating button, but not immediately above it.
- Requested `ask-plan` handling before implementation.
- Scope is limited to `@kmsf/chat` floating chatbot panel positioning, tests, plan docs, and package report.

### Repo Sources Checked

- `AGENTS.md`
- `src/components/AGENTS.md`
- `test/AGENTS.md`
- `src/core/floating-preferences.ts`
- `src/components/ChatFloatingButton.tsx`
- `src/styles/_floating.scss`
- `test/vitest/floating-preferences.test.ts`
- `test/playwright/specs/floating-chatbot.spec.ts`

### Confirmed Repo Facts

- `calculateFloatingPanelPosition()` places the panel with `preferredY = buttonPosition.y - panelSize.height - gap`.
- `ChatFloatingButton.tsx` defines `FLOATING_PANEL_GAP = 12`.
- `ChatFloatingButton.tsx` also defines `FLOATING_PANEL_HEIGHT = 280` and passes that fixed height into the panel position helper.
- `.kmsf-chat-floating__panel` does not set a fixed height. It uses `max-height`, padding, grid gap, and content-driven height.
- Empty or short floating sessions can therefore render with an actual panel height lower than `280px`.
- The existing Playwright test only asserts that the panel is above the button by at least 8px. It does not assert the intended `12px` gap.

### Root Cause Hypothesis

- The panel top is calculated with a fixed expected height, but the browser renders the panel using its actual content height.
- If the actual panel height is smaller than `280px`, the calculated `top` remains too high.
- This creates a visible vertical gap larger than the intended `12px` between the panel bottom and floating button top.

### Recommended Fix Direction

- Keep the existing `12px` gap contract.
- Measure the rendered floating panel size and pass that measured size into `calculateFloatingPanelPosition()`.
- Avoid forcing a fixed `280px` CSS height because that would make the empty panel unnecessarily tall and reduce future customizability.
- Prevent visible jump by rendering the first open panel in a measured or visually hidden state, then applying the measured position before showing it.
- Keep viewport clamping and fallback-below behavior unchanged when there is not enough space above the button.

### Ask Gate

Ask gate is clear for the floating panel gap plan.
No new supervisor-owned UX decision is required because the existing contract already says the panel should open directly above the floating button, with the package's existing `12px` gap.

### Residual Risks

- Dynamic message content can change the panel height after it opens. The implementation should re-measure after open state and message list changes.
- Measuring DOM size requires browser-only code in the React component; SSR should keep the existing no-window fallback path.
- Playwright exact pixel assertions should allow a small tolerance for browser rounding.
