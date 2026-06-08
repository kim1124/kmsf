# @kmsf/gridstack GridStack Adapter Research

## Reviewed Facts

- 이 파일은 `gridstack` 도메인의 사용자 검토 완료 사실만 기록한다.
- 2026-05-03 기준으로 `charts` 하네스 모델을 패키지별 지침 구조의 기준으로 삼는다.
- 중요 내용은 실현 및 구현 가능성이 98% 이상인 경우에만 남긴다.

## Scope

`src/gridstack`은 GridStack engine lifecycle과 option mapping을 package-owned adapter로 격리한다.

## Stable Rules

- raw GridStack instance를 primary public API로 노출하지 않는다.
- imperative DOM lifecycle은 adapter 안에서만 처리한다.
- engine replacement 가능성을 깨는 public contract를 만들지 않는다.

## 2026-05-27 Resize Interaction Findings

- GridStack `dragstart`/`resizestart` callbacks are emitted before the active node interaction starts, and `dragstop`/`resizestop` callbacks are emitted before the final `change` custom event completes.
- Calling `adapter.sync()` during active drag/resize can immediately run `grid.updateOptions`, `grid.column`, and widget update calls while GridStack still owns active interaction state.
- The safe adapter behavior is to keep public React props current, but defer imperative GridStack engine sync until after the active interaction has completed.

## 2026-06-08 Resize Boundary Exit Findings

- Installed GridStack version is `12.6.0`.
- GridStack resize lifecycle exposes `resizestart`, `resize`, and `resizestop`; `resizestop` is the official post-resize completion event.
- GridStack `DDResizableHandle` tracks active resize by adding `mousemove` and `mouseup` listeners to `document` after handle `mousedown`.
- `@kmsf/gridstack` adapter currently clears `isInteracting` only from GridStack `dragstop`/`resizestop`.
- If browser-window exit or focus loss prevents the document `mouseup` listener from running, GridStack may not emit `resizestop`, leaving adapter pending commit/sync state active.
- Existing Playwright coverage verifies normal `mouseup` completion and active resize sync deferral, but does not yet cover browser-boundary exit or missing `mouseup`.

## 2026-06-08 Resize Boundary Exit Implementation Findings

- Playwright RED reproduced the reported boundary issue: after simulated browser exit, `.ui-resizable-resizing` remained `true` because GridStack did not receive a document `mouseup`.
- The adapter fix keeps GridStack's cleanup path first by dispatching a synthetic document `mouseup` only after an active interaction reports a released mouse button.
- Browser-boundary exit with the mouse button still pressed keeps the resize active; a later `buttons === 0` mouse event uses that event's current coordinates so GridStack applies its own min/max resize constraints before `resizestop`.
- Forced item DD binding recovery uses GridStack's public `prepareDragDrop(item, true)` path plus `grid.movable()`/`grid.resizable()`; the adapter does not directly delete `_initDD` or `ddElement`.
- The forced cleanup preserves public API and serialized layout shape; all changes remain inside the package-owned GridStack adapter and Playwright coverage.
- Full verification passed after rerunning `verify:full` outside the sandbox bind restriction: 25 Playwright tests passed and 7 existing mobile pointer-only tests were skipped.

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.
