# Test Plan

## Active Plan

1. Write focused RED tests before changing behavior or guardrails.
2. Run the focused test and confirm the expected failure reason.
3. Implement the minimum change for GREEN.
4. Run `npm --workspace=@kmsf/charts run test:run`.
5. Run `npm --workspace=@kmsf/charts run test:e2e` when browser behavior changes.
6. Run `npm --workspace=@kmsf/charts run verify:full` before completion.

## Canvas Layer Test Rule

- Playwright chart rendering checks use the shared card-level canvas layer classifier.
- Do not replace card-level checks with loose page-level canvas ranges.
- If a chart needs multiple canvases, document the chart type, trigger option, expected layer ids, and source reference in the classifier allow-list before accepting it.
- `zr_undefined`, growing canvas counts, stale canvases after switch/unmount, blank canvases, and zero-size canvases remain failures.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_test-plan.md`.

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.
