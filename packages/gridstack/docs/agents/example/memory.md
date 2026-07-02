# @kmsf/gridstack Example Memory

## History

- 2026-05-03: `charts`의 agent map, `docs/agents`, path-local `AGENTS.md`, report gate 방식을 이 도메인에 맞춰 정리했다.

## Context Compaction Checkpoint

- 다음 에이전트는 패키지 root `AGENTS.md`를 먼저 읽고, 이 도메인의 `research.md`와 `plan.md`를 확인한 뒤 작업한다.
- instruction-only 변경은 TDD 예외지만, 구조 검증과 리포트 기록은 유지한다.

## 2026-07-01 Docs Example Composition Checkpoint

- Supervisor approved all recommended decisions for the gridstack docs/example composition.
- Runtime API scope is included: add widget-level `movable?: boolean` and `resizable?: boolean`; keep `locked` as both move and resize locked for compatibility.
- Example UI should add package-local Dialog and Select components under `example/src/components/ui/*`, following the data-table pattern and avoiding new runtime dependencies.
- API docs should cover only public `@kmsf/gridstack` APIs, not raw GridStack internals.
- Implementation must start RED-first because public runtime behavior and browser-visible example UX both change.
