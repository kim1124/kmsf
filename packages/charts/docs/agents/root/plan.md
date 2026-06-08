# Root Plan

## Active Plan

1. Keep root `AGENTS.md` as the package instruction map.
2. Keep reusable harness guidance in `GUIDE.md`.
3. Keep domain knowledge in `docs/agents/<domain>`.
4. Keep path-specific runtime rules in local `AGENTS.md` files.
5. Enforce instruction structure with `test/vitest/package-contract.test.ts`.
6. Run focused contract tests before full verification.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_root-plan.md`.

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.
