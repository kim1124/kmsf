# @kmsf/gridstack GridStack Adapter Memory

## History

- 2026-05-03: `charts`의 agent map, `docs/agents`, path-local `AGENTS.md`, report gate 방식을 이 도메인에 맞춰 정리했다.
- 2026-05-27: active resize 중 column/options prop 변경이 들어오면 GridStack engine sync를 stop 이후 frame으로 지연하도록 adapter를 수정했다. 회귀 테스트는 resize 중 column 변경 시 engine column이 interaction 종료 전에는 기존 값으로 유지되고 종료 후 최신 값으로 반영되는지 확인한다.

## Context Compaction Checkpoint

- 다음 에이전트는 패키지 root `AGENTS.md`를 먼저 읽고, 이 도메인의 `research.md`와 `plan.md`를 확인한 뒤 작업한다.
- instruction-only 변경은 TDD 예외지만, 구조 검증과 리포트 기록은 유지한다.
