# @kmsf/gridstack GridStack Adapter Memory

## History

- 2026-05-03: `charts`의 agent map, `docs/agents`, path-local `AGENTS.md`, report gate 방식을 이 도메인에 맞춰 정리했다.
- 2026-05-27: active resize 중 column/options prop 변경이 들어오면 GridStack engine sync를 stop 이후 frame으로 지연하도록 adapter를 수정했다. 회귀 테스트는 resize 중 column 변경 시 engine column이 interaction 종료 전에는 기존 값으로 유지되고 종료 후 최신 값으로 반영되는지 확인한다.
- 2026-06-08: resize 중 browser-boundary exit로 document `mouseup`이 누락되는 경로를 Playwright로 재현하고, adapter에서 active interaction 동안만 `mousemove`/`mouseleave`/`visibilitychange` guard를 붙였다. button-down 상태의 boundary exit는 즉시 종료하지 않고, 이후 `buttons === 0` 이벤트의 현재 좌표로 GridStack cleanup을 synthetic `mouseup`으로 유도한다. Forced item DD binding 복구는 내부 `_initDD` 삭제 없이 `grid.prepareDragDrop(item, true)` 공개 경로를 사용한다.
- 2026-06-09: 공식 GridStack demo parity 계획에서 사용자 결정 항목이 모두 닫혔다. 범위는 drag와 resize 전체이며, active pointer movement는 GridStack native path가 우선 소유한다. 순정 GridStack과 맞추기 위해 button-down boundary exit, blur, visibility loss는 observation-only로 취급하고, adapter fallback은 observable release-like signal 이후 한 tick 동안 native stop을 기다린 뒤 stale state가 남을 때만 실행한다. Headed/manual 확인은 필수이고, 동작은 public option 없이 기본값으로 적용한다.
- 2026-06-09: native interaction parity 구현을 진행했다. `mousemove.buttons === 0`에서 즉시 synthetic `mouseup`을 dispatch하던 경로를 release-like signal 후 한 frame stale check로 변경했고, drag/resize browser-boundary 및 grid-area exit Playwright coverage를 추가했다. `verify:full`은 sandbox EPERM 이후 escalated rerun에서 통과했다. Headed/manual tool control은 transport failure로 완료하지 못했고, headed automated run은 favicon 404 diagnostic 때문에 실패했다.

## Context Compaction Checkpoint

- 다음 에이전트는 패키지 root `AGENTS.md`를 먼저 읽고, 이 도메인의 `research.md`와 `plan.md`를 확인한 뒤 작업한다.
- instruction-only 변경은 TDD 예외지만, 구조 검증과 리포트 기록은 유지한다.
- 2026-06-09 계획 이후 구현을 시작한다면 먼저 `docs/agents/gridstack/2026-06-09-native-interaction-plan.md`를 읽고 RED Playwright coverage부터 추가한다.
