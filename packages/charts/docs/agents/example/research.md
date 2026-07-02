# Example Research

## Reviewed Findings

- The example is a consumer-facing Vite/React app.
- It proves rendered chart behavior through Playwright.
- Sample data and usage code help external consumers understand the package.

## High-Confidence Scope

- Example-only data and styles must not leak into runtime exports.
- Browser console errors are completion blockers for rendered UI changes.

## 2026-05-26 Docs And Sample Page Findings

- shadcn/ui is a source-copied React component pattern, not a runtime component package. The charts example must keep the copied UI primitives local to `example/src`.
- The current charts example has no Tailwind or shadcn config. A minimal local UI primitive set is safer than introducing a full app-level shadcn migration in one step.
- The official ECharts cheat sheet is the canonical source for chart type grouping. The example should expose the supported `GenericChart` types and link advanced option details to ECharts docs instead of duplicating the full option reference.
- `@kmsf/gridstack` already provides `DashboardGrid` and `useDashboardGrid`, so dynamic chart creation/deletion should be implemented as a separate example page that consumes that public API.

## 2026-05-27 Example Improvement Findings

- `example/src/App.tsx` currently applies one accent color through `seriesOptions`. This is insufficient for series-level and item/category-level distinction, especially pie, wordCloud, funnel, treemap, and axis TOP charts.
- `src/common/theme.ts` exposes KMSF palette colors. For TOP 50 examples, the current example/shared 10-color palette uses the KMSF mint family and maps data indexes by modulo instead of generating random colors.
- ECharts official docs distinguish `tooltip.trigger: "axis"` for axis charts and `tooltip.trigger: "item"` for charts without category axes. The current common tooltip default is always `"axis"`, so Sankey-like item charts can fail to show tooltip even when the tooltip toggle is enabled.
- ECharts `alignTicks` defaults to `false`, but the warning `The ticks may be not readable when set min ... max ... and alignTicks: true` can still appear when a sample or merged option enables it with fixed `min`/`max`. The implementation must identify the emitting chart by warning capture and explicitly remove or override the conflicting axis option.
- The stage header currently renders both data format and category badges, which creates duplicate-looking labels such as `trend` and `Trend`. These labels do not explain the chart to users and should be removed or replaced with a single plain description.
- Collapsed chart navigation currently still has text-oriented header/content assumptions. The collapsed state should use chart-type icons with accessible labels and tooltips, not truncated text.
- GridStack's `change` event can fire while a resize interaction is still active. The current `@kmsf/gridstack` adapter commits layout on `change`, `dragstop`, and `resizestop`; committing React state during active resize can cause `adapter.sync()` to call GridStack `update()` before GridStack's own stop handler reads `node._orig.w`, matching the reported `Cannot read properties of undefined (reading 'w')` path.
- Browser diagnostics must treat console warnings as failures for this work. The Playwright canvas pixel helper should request `willReadFrequently: true` or use a non-warning render check so the test itself does not introduce a browser warning.

## 설계 결정 질문 루프

- 이 문서를 작성하거나 갱신하기 전에 사용자 결정이 필요한 항목을 질문으로 분리한다.
- 답변 전에는 추천안을 확정된 계획이나 결론으로 쓰지 않는다.
- 답변 이후에도 재결정 항목이 남으면 추가 질문을 먼저 한다.
- 모든 사용자 결정 항목이 닫힌 뒤 내용을 확정한다.


## 2026-06-30 Playground Docs Renewal Research

- `@kmsf/data-table`의 문서형 playground 방향을 기준으로, `@kmsf/charts` example도 왼쪽 문서 nav와 오른쪽 설명/코드/라이브 예제를 같은 route에서 제공하는 구조가 적합하다고 확인했다.
- 기존 hash router 기반 chart workspace는 path route로 전환해 `/docs/getting-started`, `/examples/generic-chart`, `/performance/large-data`, `/examples/dashboard-integration`, `/api/props`를 직접 진입 가능하게 구성한다.
- 문법 하이라이트는 `prism-react-renderer`를 dev dependency로 추가해 example 전용 코드 블록에만 사용한다.
- route 전환 시 이전 live example이 unmount되는지 Playwright에서 `window.__kmsfChartsLastUnmount`로 검증한다.
- ask gate clear: 사용자가 차트와 그리드스택만 진행하고, 한국어 문서와 추천 구조, dashboard integration 하단 route 추가에 동의했다.
