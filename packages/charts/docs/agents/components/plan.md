# Components Plan

## Active Plan

1. Confirm whether the requested change affects public API, data contract, or rendered canvas.
2. Add or update the smallest Vitest or Playwright failing test first.
3. Implement the minimum component change required for GREEN.
4. Keep ECharts lifecycle in `src/common`.
5. Run focused tests, then `verify:full`.

## Split Rule

If this file grows beyond 500 lines, move detailed steps into `plans/00_components-plan.md`.

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.
