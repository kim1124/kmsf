# Agent Knowledge Map

이 디렉터리는 `@kmsf/charts`의 에이전트용 지식, 계획, 히스토리를 관리한다.
실제 실행 규칙은 각 코드 경로의 `AGENTS.md`를 우선한다.

## Domains

| Domain | Runtime path | Knowledge path | 역할 |
| --- | --- | --- | --- |
| root | `AGENTS.md` | `docs/agents/root` | 패키지 전역 map과 공통 하네스 |
| common | `src/common/AGENTS.md` | `docs/agents/common` | ECharts engine, options, data, theme |
| components | `src/components/AGENTS.md` | `docs/agents/components` | public chart components and aliases |
| test | `test/AGENTS.md` | `docs/agents/test` | Vitest, Playwright, reports, artifacts |
| example | `example/AGENTS.md` | `docs/agents/example` | Vite/React consumer example |

## File Contract

- `research.md`: 검토 완료된 고신뢰 사실만 기록한다.
- `plan.md`: active plan index와 현재 구현 절차를 기록한다.
- `memory.md`: 결정 히스토리와 context compaction checkpoint를 기록한다.

## Update Rules

- 브레인스토밍 후 사용자가 승인한 내용만 `research.md`에 반영한다.
- 구현 전 `plan.md`를 갱신한다.
- 계획 검토 후 `memory.md`에 결정과 잔여 리스크를 남긴다.
- 상세 계획이 500줄을 넘으면 `plans/00_name.md`, `plans/01_name.md`로 분할한다.
