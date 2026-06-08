# Components Research

## Reviewed Findings

- Public names are `GaugeChart` and `SunburstChart`.
- Misspelled `GuageChart` and `SunbustChart` are not public exports and must not be reintroduced.
- `GenericChart`, `RadarChart`, `HeatmapChart`, and `GraphChart` are public exports.
- `TrendChart` requires `series`; non-Trend charts may generate default series when safe.

## High-Confidence Scope

- Component changes must preserve generic React compatibility.
- Rendered chart behavior requires Playwright when user-visible output changes.

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.
