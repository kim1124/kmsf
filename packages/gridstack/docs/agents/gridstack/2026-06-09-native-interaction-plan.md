# GridStack Native Interaction Parity Implementation Plan

## Status

- Date: 2026-06-09 KST
- Scope: `@kmsf/gridstack` GridStack adapter interaction lifecycle
- Status: planning complete, implementation not started in this plan update
- Ask gate: clear. Supervisor decisions are closed.
- Revision: updated after implementation review so adapter behavior stays aligned with vanilla GridStack DD semantics.

## Goal

Make widget drag and resize feel consistent with the official GridStack demo by letting GridStack own the active pointer interaction path first, while the React adapter observes interaction state and commits serialized layout state after the native interaction has stopped.

This plan replaces the resize-only boundary recovery model with a drag-and-resize native-first model.

The adapter must not create a second interaction lifecycle. Its fallback path exists only to recover a stale adapter/GridStack state after a release-like signal was observed and GridStack did not emit its own stop event.

## Confirmed Supervisor Decisions

1. Apply the fix to both drag movement and resize.
2. Prefer GridStack native interaction ownership during active drag and resize; React state commits after the interaction.
3. Do not force cleanup immediately. Wait one tick for GridStack's own stop path, then fallback only when stale state remains.
4. Include headed/manual confirmation in addition to automated E2E verification.
5. Make this the package default behavior. Do not add a public option or opt-in flag.

## Current Repo Facts

- `src/gridstack/adapter.ts` already isolates GridStack lifecycle behavior behind the package adapter boundary.
- The adapter tracks `isInteracting` and defers `sync()` while drag or resize is active.
- Current boundary recovery calls synthetic document events when later pointer events report `buttons === 0`.
- Current recovery can call `grid.prepareDragDrop(item, true)` plus `grid.movable()` and `grid.resizable()` to restore DD binding through a public GridStack path.
- Current Playwright coverage includes resize browser-boundary release and grid-area exit behavior, but does not yet cover the same native-first parity for drag movement.
- Installed GridStack DD code attaches document-level capture `mousemove` and `mouseup` handlers for both resize and drag, and does not use adapter-style blur or visibility cleanup for normal completion.

## Root Cause Direction

The unnatural pause is likely not a GridStack engine limitation. The official demo lets GridStack own the pointer stream directly. This package wraps GridStack in a controlled React adapter, and the adapter currently observes browser-boundary signals and may synthesize cleanup in ways that can interrupt the engine's native drag/resize cadence.

The implementation direction is therefore to remove adapter intervention from active pointer movement and keep forced cleanup as a delayed stale-state recovery path only after a release signal. Boundary exit while the mouse button is still pressed must remain active, matching vanilla GridStack.

## Non Goals

- Do not expose the raw GridStack instance as a new public API.
- Do not add a public behavior option.
- Do not introduce new dependencies.
- Do not rewrite the package into an uncontrolled-only wrapper.
- Do not change serialized layout shape or widget ID behavior.
- Do not introduce Next.js-specific APIs.

## Implementation Plan

### Task 1: Add RED Interaction Parity Coverage

Add or update focused Playwright tests before production code changes.

1. Cover resize leaving the grid area while the mouse remains pressed.
2. Cover resize leaving the browser boundary and finishing after a later release signal.
3. Add equivalent drag movement coverage for grid-area exit.
4. Add equivalent drag movement coverage for browser-boundary release.
5. Assert that active drag or resize remains visually active while the mouse button is still pressed.
6. Assert that final layout is committed only after GridStack stop or stale fallback completion.

Expected first result: at least drag-boundary parity should fail or expose the current unnatural interaction path before adapter changes.

### Task 2: Make Adapter Native First

Refactor active interaction handling in `src/gridstack/adapter.ts`.

1. Keep GridStack `dragstart`, `resizestart`, `dragstop`, and `resizestop` as the primary lifecycle source.
2. Track the last known pointer coordinate during active interaction for fallback only.
3. Treat `mouseleave` with `buttons === 1`, window blur, and document visibility loss as observation-only lost-boundary signals. Do not end the interaction from those signals.
4. Treat document or window `mouseup`, `pointerup`, or a later move event with `buttons === 0` as release-like signals.
5. On a release-like signal, capture that signal's current coordinates and schedule a one-tick stale-state check.
6. If GridStack emits `dragstop` or `resizestop` before that check, cancel fallback and do not dispatch synthetic events.
7. If the one-tick check still sees stale active state, dispatch the minimum synthetic `mouseup` needed at the release coordinate.
8. Only call `prepareDragDrop(item, true)` if stale GridStack DD binding or active CSS classes remain after fallback.

The normal native path should complete without synthetic cleanup.

The fallback path must not use `0,0` coordinates. If no pointer coordinate has ever been observed, leave the interaction pending until the next observable release or re-entry event rather than committing a stale location.

### Task 3: Keep React Sync Behind Stop

Preserve the controlled React contract without disturbing active GridStack movement.

1. Keep latest public options in adapter state during interaction.
2. Do not run GridStack option sync or widget sync while `isInteracting` is true.
3. On native stop or fallback stop, commit layout once from GridStack's current nodes.
4. Apply any deferred sync on the next animation frame.
5. Avoid introducing a new public batching API in this change.

If post-stop React churn is still visible after Task 2, treat batching as a separate follow-up because it could affect consumer state semantics.

### Task 4: Manual and Automated Verification

Run the smallest relevant verification first, then package gates.

1. `npm run lint`
2. Focused Chromium Playwright for drag and resize boundary parity.
3. Focused Chromium Playwright for normal in-document drag and resize completion to verify no fallback interference.
4. `npm run verify`
5. `npm run verify:full`
6. Headed/manual confirmation against the local playground:
   - drag outside the grid and return
   - resize outside the grid and return
   - drag toward the browser edge and release
   - resize toward the browser edge and release
   - leave the browser while still pressing, return while still pressing, then release
   - repeat the same widget interaction after recovery
7. Compare the headed/manual behavior against the official GridStack demo interaction pattern: no adapter-driven stop while the mouse button is still held.

Manual confirmation is required before reporting implementation as complete.

## Acceptance Criteria

- Drag and resize both remain visually continuous while the mouse button is still pressed outside the grid area.
- Drag and resize do not remain stuck when the pointer leaves the browser and the button is released.
- Normal in-document mouseup completes through GridStack's native stop path without adapter-forced synthetic cleanup.
- Forced cleanup runs only after an observable release-like signal and the one-tick stale-state check.
- Repeated interaction on the same widget works after recovery.
- No new public option is added.
- Package verification and headed/manual confirmation are recorded in `reports/YYYY-MM-DD.md`.

## Residual Risks To Validate During Implementation

- Browser automation cannot fully reproduce every OS-level outside-window release path, so headed/manual verification remains mandatory.
- If a browser provides no release or re-entry event after the pointer leaves the window, code cannot know the current release coordinate. The adapter must wait for the next observable release or re-entry event instead of inventing coordinates.
- Moving fallback later may expose existing adapter sync timing assumptions in tests that currently expect immediate synthetic cleanup.
- Per-widget React layout callbacks may still create a small post-stop render burst; this plan keeps that out of scope unless Task 2 evidence shows it is the remaining visible cause.

## Implementation Order

1. Add RED Playwright coverage for drag and resize parity.
2. Run focused tests and capture failing behavior.
3. Refactor adapter to release-gated native-first fallback semantics.
4. Re-run focused tests.
5. Run package verification.
6. Run headed/manual playground confirmation.
7. Update report with commands, result, and remaining risk.
