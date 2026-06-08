# @kmsf/gridstack GridStack Adapter Memory

## History

- 2026-05-03: `charts`의 agent map, `docs/agents`, path-local `AGENTS.md`, report gate 방식을 이 도메인에 맞춰 정리했다.
- 2026-05-27: active resize 중 column/options prop 변경이 들어오면 GridStack engine sync를 stop 이후 frame으로 지연하도록 adapter를 수정했다. 회귀 테스트는 resize 중 column 변경 시 engine column이 interaction 종료 전에는 기존 값으로 유지되고 종료 후 최신 값으로 반영되는지 확인한다.
- 2026-06-08: resize 중 browser-boundary exit로 document `mouseup`이 누락되는 경로를 Playwright로 재현하고, adapter에서 active interaction 동안만 `mousemove`/`mouseleave`/`visibilitychange` guard를 붙였다. button-down 상태의 boundary exit는 즉시 종료하지 않고, 이후 `buttons === 0` 이벤트의 현재 좌표로 GridStack cleanup을 synthetic `mouseup`으로 유도한다. Forced item DD binding 복구는 내부 `_initDD` 삭제 없이 `grid.prepareDragDrop(item, true)` 공개 경로를 사용한다.

## Context Compaction Checkpoint

- 다음 에이전트는 패키지 root `AGENTS.md`를 먼저 읽고, 이 도메인의 `research.md`와 `plan.md`를 확인한 뒤 작업한다.
- instruction-only 변경은 TDD 예외지만, 구조 검증과 리포트 기록은 유지한다.
