# @kmsf/chat Root Plan

## Active Plan

- Design spec: `docs/superpowers/specs/2026-06-08-kmsf-chat-package-design.md`
- TDD implementation plan: `docs/superpowers/plans/2026-06-08-kmsf-chat-package-implementation.md`
- Chat UI redesign spec: `docs/superpowers/specs/2026-06-18-chat-ui-redesign-design.md`
- Chat UI redesign implementation plan: `docs/superpowers/plans/2026-06-18-chat-ui-redesign-implementation.md`
- Chat verification plan: `docs/superpowers/plans/2026-06-18-chat-verification-plan.md`
- Chat risk follow-up plan: `docs/superpowers/plans/2026-06-19-chat-risk-followup-plan.md`
- Chat UI polish follow-up plan: see `2026-06-23 UI Polish Follow-up Implementation Plan` below.
- Chat sidebar minimum visibility follow-up plan: see `2026-06-24 Sidebar Minimum Visibility Follow-up Implementation Plan` below.
- Chat sidebar polish follow-up plan: see `2026-06-24 Chat Sidebar Polish Follow-up Implementation Plan` below.

## Decision State

Chat UI redesign implementation has been executed.
Ask gate is clear for the 2026-06-19 risk follow-up implementation because supervisor decisions are fixed for deletion contract, setup success feedback, and chat failure persistence.
Ask gate is clear for the 2026-06-23 UI polish follow-up because supervisor decisions are fixed for setup toast feedback, sidebar resize persistence, sidebar width bounds, floating backdrop behavior, and dragged button panel positioning.
Ask gate is clear for the 2026-06-24 sidebar minimum visibility follow-up because the existing supervisor decision keeps the sidebar minimum at 200px, active mint styling, right-edge hover actions, and ellipsis behavior.
Ask gate is clear for the 2026-06-24 chat sidebar polish follow-up because supervisor decisions are fixed for normal 5px title reserve, hover/focus dynamic action reserve, main-only loading block, spinner overlay, and edit/delete action styling.

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

## 2026-06-23 UI Polish Follow-up Decisions

- Setup completion feedback changes from persistent top banner to temporary top toast.
- Sidebar width is resizable and persisted with default 300px, minimum 200px, and maximum 35% of the site/viewport width.
- Floating chatbot backdrop click does not close by default, but a backdrop event handler contract should be exposed for consumer customization.
- Floating chatbot panel opens relative to the dragged button position and clamps to the viewport.

## 2026-06-24 Sidebar Minimum Visibility Follow-up Decisions

- The sidebar minimum remains 200px.
- The sidebar maximum remains 35% of the site/viewport width.
- Thread items must keep the full available sidebar width at the minimum size.
- Edit/delete controls remain floating right-edge hover/focus actions.
- Thread title text uses ellipsis only after keeping a meaningful visible title area.
- Active thread styling remains mint/accent background with white/accent-foreground text.

## 2026-06-24 Chat Sidebar Polish Follow-up Decisions

- Normal thread title right reserve is reduced to 5px.
- On thread row hover/focus, the right reserve grows to the action button group width using package CSS variables.
- Active thread text must remain visible by ensuring the active select button background matches the mint/accent active state.
- Thread selection loading blocks only the main content area.
- Loading UI uses a spinner overlay, not a skeleton list.
- Hover action buttons remove borders.
- Edit action stays neutral.
- Delete action uses red icon color and red soft hover background.

## 2026-06-23 UI Polish Follow-up Implementation Plan

### Summary

- Target package: `@kmsf/chat`.
- Scope: `packages/chat` source, styles, tests, example playground, and package-local report.
- No new runtime dependency is planned.
- Existing `local-db`, Supabase, and Ollama contracts remain unchanged.

### Confirmed UX Contract

- Setup completion feedback is a top toast that appears temporarily and disappears automatically.
- Storage option radio controls are vertically centered in setup and settings option cards.
- Pending assistant responses show animated `...` dots.
- Visible `User` and `Assistant` labels are removed from chat bubbles.
- User bubbles use KMSF mint/accent background with white/accent-foreground text.
- Assistant bubbles use white/surface background.
- Left sidebar is resizable, persisted to package localStorage, default 300px, minimum 200px, maximum 35% of site/viewport width.
- Chat title overflow uses ellipsis.
- Rename/delete actions stay floating at the right edge on hover/focus.
- Active chat list item uses mint/accent background and white/accent-foreground text.
- Floating chatbot closes only through the floating button.
- Floating chatbot backdrop click is no-op by default, but an optional backdrop event handler should be exposed for consumers.
- Floating chatbot panel opens relative to the dragged button position and clamps to the viewport.
- Floating chatbot open state renders an approximately 40% opaque gray backdrop.

### Implementation Steps

1. Replace setup success banner with package toast behavior.
   - Remove persistent `.kmsf-chat-status-banner` layout usage from the playground.
   - Add a top toast region with `role="status"` or `aria-live="polite"`.
   - Auto-dismiss after a short duration.

2. Fix storage option radio alignment.
   - Update `.kmsf-chat-storage label` and `.kmsf-chat-storage-card` layout.
   - Cover `ChatSetupPage` and `ChatSettingsDialog`.

3. Add pending assistant animation.
   - Add a reusable pending dots class.
   - Render animated dots for main chat and floating chat assistant messages with `status: "pending"`.
   - Keep error rendering unchanged.

4. Update message bubble rendering and styles.
   - Remove visible role label rendering from `ChatMessageList`.
   - Apply user mint/white and assistant white/surface bubble styles.
   - Apply the same role color contract to floating chatbot bubbles.

5. Add resizable sidebar.
   - Add a width preference helper or UI-local utility.
   - Persist width with a package-scoped localStorage key.
   - Clamp to default 300px, min 200px, max 35% viewport/site width.
   - Add a drag handle between sidebar and main content.
   - Preserve collapsed 72px mode and restore saved width on expand.
   - Preserve ellipsis and right-edge floating actions.

6. Fix floating chatbot backdrop and panel positioning.
   - Render backdrop only while the floating panel is open.
   - Keep backdrop click as no-op by default.
   - Expose optional backdrop event handler prop.
   - Position panel relative to button coordinates and clamp to viewport.
   - Ensure drag followed by click opens the panel at the expected location.

7. Update documentation and report.
   - Update package docs if public props are added.
   - Update `reports/2026-06-23.md` with implementation commands, results, and residual risks.

### Test Plan

- Vitest:
  - sidebar width default/min/max clamp.
  - sidebar width localStorage load/save.
  - invalid stored sidebar width fallback.
  - floating panel placement relative to button and viewport clamp.
  - optional backdrop handler contract.
- Playwright:
  - setup completion toast appears and persistent banner area is absent.
  - setup/settings radio controls are vertically centered.
  - pending assistant answer shows animated dots.
  - main chat bubbles have no visible role labels and use user mint / assistant white styling.
  - sidebar resize changes width, persists after reload, and clamps to min/max.
  - long thread titles ellipsize and actions stay on the right edge on hover/focus.
  - active chat list item uses mint background and white text.
  - dragged floating button opens the panel relative to the saved position.
  - floating open state shows gray 40% backdrop.
  - backdrop click does not close by default.
- Gate:
  - `npm --workspace=@kmsf/chat run lint`
  - `npm --workspace=@kmsf/chat run test:run`
  - `npm --workspace=@kmsf/chat run build`
  - `npm --workspace=@kmsf/chat run test:e2e`
  - `npm --workspace=@kmsf/chat run verify:full`
  - `git diff --check -- package-lock.json packages/chat`

### Residual Risks

- Live Ollama remains environment-dependent and optional unless explicitly requested.
- Toast duration and dot animation timing may need browser tuning during Playwright implementation.
- Backdrop customization is a package event contract only; no consumer-specific app integration is included.

## 2026-06-24 Sidebar Minimum Visibility Follow-up Implementation Plan

### Summary

- Target package: `@kmsf/chat`.
- Scope: thread list layout, sidebar narrow-width behavior, focused Playwright regression, and package-local report.
- This is a follow-up bugfix to the 2026-06-23 resizable sidebar work.
- No new runtime dependency is planned.
- No public API change is planned.

### Confirmed Facts

- The current sidebar width contract is default 300px, minimum 200px, and maximum 35% of the site/viewport width.
- `.kmsf-chat-sidebar` has 14px horizontal padding, leaving about 172px inner width at the 200px minimum.
- `.kmsf-chat-thread-select` currently reserves `padding-right: 88px` even when edit/delete actions are hidden.
- At the 200px minimum, the reserved action space leaves too little visible title area.
- `.kmsf-chat-thread-actions` is already absolutely positioned and hidden until hover/focus.
- Existing Playwright coverage verifies resize persistence and action overlay, but not minimum-width title visibility.

### Implementation Steps

1. Add a failing Playwright regression for the 200px sidebar case.
   - Persist or resize the sidebar to 200px.
   - Render at least one long-title thread.
   - Assert the thread row and select control stay inside the sidebar bounds.
   - Assert the visible title area is not collapsed by the edit/delete action reservation.
   - Assert hover/focus actions still appear at the right edge.
   - Assert the active thread keeps mint/accent background and white/accent-foreground text.

2. Fix thread row CSS while preserving the existing DOM structure.
   - Keep `.kmsf-chat-thread-row` and `.kmsf-chat-thread-select` full width.
   - Remove or reduce the permanent 88px right padding for normal narrow rendering.
   - Use responsive/custom-property-based action reserve so hidden actions do not consume excessive title space at 200px.
   - Keep enough right inset for hover/focus actions to avoid overlapping the last readable title characters.

3. Fix inline rename field width behavior.
   - Apply the same narrow-width action reserve logic to `.kmsf-chat-thread-rename`.
   - Preserve Enter save, blur save, and Esc cancel behavior.

4. Keep collapsed sidebar behavior unchanged.
   - Preserve the 72px collapsed icon-first mode.
   - Keep actions hidden in collapsed mode.
   - Keep title tooltip behavior for collapsed rows.

5. Run focused verification and baseline gates.
   - First run the new/focused Playwright test to confirm RED, then GREEN.
   - Run package Vitest only if helper/state code changes are introduced.
   - Run package lint, build, e2e, verify:full before completion.

6. Update report.
   - Record changed files, commands actually run, pass/fail result, and residual risks in `reports/2026-06-24.md`.

### Test Plan

- Playwright:
  - minimum 200px sidebar keeps thread row/select inside sidebar bounds.
  - minimum 200px sidebar keeps a meaningful title text area instead of collapsing behind action padding.
  - hover/focus edit/delete actions slide in at the right edge without shrinking the item width.
  - active thread uses mint/accent background and white/accent-foreground text at 200px.
  - existing sidebar resize persistence still passes.
- Gate:
  - `npm --workspace=@kmsf/chat run lint`
  - `npm --workspace=@kmsf/chat run build`
  - `npm --workspace=@kmsf/chat run test:e2e`
  - `npm --workspace=@kmsf/chat run verify:full`
  - `git diff --check -- package-lock.json packages/chat`

### Residual Risks

- Local browser automation may require elevated permissions in this environment.
- The exact "meaningful visible title area" threshold is a regression-test heuristic; initial target is to keep at least half of the 200px sidebar inner width available to title text before ellipsis.
- External ChatGPT layout details are not available as a public CSS contract, so this implementation follows the observable product pattern rather than copying proprietary dimensions.

## 2026-06-24 Chat Sidebar Polish Follow-up Implementation Plan

### Summary

- Target package: `@kmsf/chat`.
- Scope: sidebar thread item spacing, active item visibility, main-content thread-loading overlay, hover action styling, Playwright/Vitest coverage, and package-local report.
- No new runtime dependency is planned.
- No public API change is planned.
- The package remains standalone and must not import `apps/kmsf`.

### Confirmed UX Contract

- Thread title should use almost the full menu width in the normal state.
- Normal right reserve is `5px`.
- Hover/focus reveals edit/delete actions and increases title right reserve to the action group width.
- Active thread remains mint/accent with white/accent-foreground text and the title must not disappear.
- Selecting an uncached thread shows a main-content-only spinner overlay until `loadMessages()` completes.
- Sidebar remains usable while main content is loading.
- Main content should expose loading semantics with `aria-busy` and prevent main/composer interaction while loading.
- Edit/delete hover actions are borderless.
- Delete action is visually destructive through red icon color and red soft hover background.

### Implementation Steps

1. Add failing Playwright coverage for thread title reserve.
   - Render a long thread title at the default and minimum sidebar widths.
   - Assert normal right padding is approximately 5px.
   - Hover/focus the row and assert the right padding grows to at least the edit/delete action group width.
   - Assert row/select width remains stable while actions slide in.

2. Add failing Playwright coverage for active item visibility.
   - Select a thread.
   - Assert active select background is the accent/mint color, not the surface background.
   - Assert active title text color remains white/accent-foreground and visible.

3. Add failing Playwright coverage for thread-loading overlay.
   - Use a delayed `ChatHistoryStore.loadMessages()` path or a delayed store fixture.
   - Select an uncached thread.
   - Assert `.kmsf-chat-main` has `aria-busy="true"` or equivalent loading state.
   - Assert a spinner overlay is visible in the main content.
   - Assert composer/main interaction is blocked while loading.
   - Resolve loading and assert messages render and overlay disappears.

4. Add or adjust state for thread selection loading.
   - Add `loadingThreadId` or equivalent local component state in `ChatShell`.
   - Set loading only for uncached `loadMessages()` calls.
   - Keep cached thread selection immediate.
   - Use a request sequence/ref guard so stale async results do not overwrite the latest selected thread.
   - Clear loading in `finally`.

5. Add main-content loading UI.
   - Render a package-styled spinner overlay inside `.kmsf-chat-main`.
   - Set `aria-busy` on the main region while loading.
   - Block pointer interaction in the main content only.
   - Keep sidebar navigation available.

6. Update thread action CSS.
   - Introduce package CSS variables for normal reserve and action reserve.
   - Set normal reserve to `5px`.
   - Increase reserve on row hover/focus-within.
   - Remove action button borders.
   - Keep edit action neutral.
   - Apply red icon color to delete and red soft hover background using package tokens/fallback variables.

7. Update active item CSS.
   - Ensure active `.kmsf-chat-thread-select` background and border use the accent token.
   - Ensure active text uses accent foreground.
   - Preserve ellipsis and no-width-shift behavior.

8. Update report and run verification.
   - Record TDD RED/GREEN evidence in `reports/2026-06-24.md`.
   - Run focused Playwright tests first.
   - Run package gates before completion.

### Test Plan

- Playwright:
  - normal thread item right reserve is about 5px.
  - hover/focus increases right reserve to the action group width.
  - title remains readable and row width does not shrink when actions appear.
  - active thread title remains visible with mint/accent background and white/accent-foreground text.
  - uncached thread selection shows a main-content spinner overlay and `aria-busy` state.
  - main content interaction is blocked while thread messages load.
  - overlay disappears after messages load.
  - edit/delete action buttons are borderless; delete icon is red and delete hover background is red soft.
- Vitest:
  - Add only if stale selection guard or loading state helper is extracted into `src/core`.
- Gate:
  - `npm --workspace=@kmsf/chat run lint`
  - `npm --workspace=@kmsf/chat run test:run`
  - `npm --workspace=@kmsf/chat run build`
  - `npm --workspace=@kmsf/chat run test:e2e`
  - `npm --workspace=@kmsf/chat run verify:full`
  - `git diff --check -- package-lock.json packages/chat`

### Residual Risks

- The hover reserve will be dynamic by row interaction state, but the action group width itself should be represented by CSS variables rather than runtime DOM measurement.
- Main-only loading block intentionally allows sidebar clicks during loading; stale async selection results must be guarded.
- Exact ChatGPT spacing is not public, so tests should validate KMSF behavior rather than proprietary dimensions.

## 2026-06-24 Floating Chatbot Panel Gap Follow-up Plan

### Summary

- Target package: `@kmsf/chat`.
- Scope: floating chatbot dialog positioning above the draggable floating button.
- Current issue: the dialog can open noticeably higher than the button because the component calculates position with a fixed `280px` panel height while CSS renders a content-sized panel.
- No public API change is planned.
- No new runtime dependency is planned.
- The package remains standalone and must not import `apps/kmsf`.

### Confirmed UX Contract

- The floating chatbot dialog should open directly above the floating button whenever there is enough viewport space.
- The intended vertical gap is the existing package constant, `12px`.
- The dialog may fall back below the button or clamp inside the viewport only when there is not enough space above.
- Dragged button coordinates remain persisted in local storage.
- Backdrop click behavior remains unchanged and must not close the session.

### Implementation Steps

1. Add focused Vitest coverage for the pure position helper.
   - Verify that when `panelSize.height` matches the actual panel height, the panel bottom is exactly `gap` pixels above the button top.
   - Keep existing clamp and fallback-below assertions.

2. Add failing Playwright coverage for the rendered gap.
   - Complete setup, drag the floating button to a location with enough vertical room, then open the panel.
   - Measure the floating button and dialog bounding boxes.
   - Assert `buttonTop - panelBottom` is approximately `12px` with a small rounding tolerance.
   - Keep the existing right-edge alignment assertion.

3. Measure actual panel dimensions in `ChatFloatingButton`.
   - Add a `panelRef` and measured panel size state.
   - Use a layout effect after open/render to read `getBoundingClientRect()`.
   - Recalculate panel position with the measured width and height instead of the fixed `280px` estimate.
   - Re-measure when open state, messages, pending state, or input-related panel layout can change.

4. Avoid visible first-frame jump.
   - Render the panel with a hidden or non-interactive initial measured state until the measured position is available.
   - Apply the computed `left` and `top` once the actual size is known.

5. Preserve existing behavior.
   - Keep `FLOATING_PANEL_GAP = 12`.
   - Keep button drag threshold, coordinate persistence, viewport clamp, and backdrop event hook behavior.
   - Do not force a fixed CSS panel height unless measurement proves insufficient.

6. Update report and run verification.
   - Record RED/GREEN evidence in `reports/2026-06-24.md`.
   - Run focused Vitest and Playwright tests first.
   - Run package gates before completion.

### Test Plan

- Vitest:
  - `calculateFloatingPanelPosition()` maintains exact above-button gap when supplied the actual panel height.
  - Existing clamp and fallback-below behavior still passes.
- Playwright:
  - Floating chatbot button drag and reload persistence still works.
  - Opening the floating dialog after restore places the dialog approximately `12px` above the button when there is enough space.
  - Dialog remains inside viewport horizontally.
  - Backdrop click still does not close the floating session.
- Gate:
  - `npm --workspace=@kmsf/chat run lint`
  - `npm --workspace=@kmsf/chat run test:run`
  - `npm --workspace=@kmsf/chat run build`
  - `npm --workspace=@kmsf/chat run test:e2e`
  - `npm --workspace=@kmsf/chat run verify:full`
  - `git diff --check -- package-lock.json packages/chat`

### Residual Risks

- Browser pixel rounding can make exact geometry assertions brittle; tests should allow a small tolerance.
- Content added after the panel opens can change panel height, so the implementation must re-measure on relevant content changes.
- If the button is near the top of the viewport, fallback-below or clamp behavior can legitimately prevent a `12px` above-button gap.
