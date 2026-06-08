# Root Research

## Reviewed Findings

- `AGENTS.md` should be a short map, not a complete manual.
- Root instructions should point agents to `GUIDE.md` and `docs/agents/README.md`.
- Runtime-specific rules belong in the nearest code path `AGENTS.md`.
- Long-lived knowledge, plans, and history belong under `docs/agents/<domain>`.
- Instruction drift should be caught by Vitest structural tests.

## High-Confidence Scope

- The package must remain generic React compatible and avoid Next.js runtime APIs.
- `verify:full` is the strongest package completion gate.
- New package work reports go to `packages/charts/reports/YYYY-MM-DD.md`.

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.
