# Common Plan

## Active Plan

1. Add or update focused Vitest tests before changing common helpers.
2. Keep ECharts lifecycle changes inside `KmsfChart` or common helpers.
3. Confirm no Next.js runtime imports are introduced.
4. Run `npm --workspace=@kmsf/charts run test:run`.
5. Run `npm --workspace=@kmsf/charts run verify:full` before completion.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_common-plan.md`.

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.
