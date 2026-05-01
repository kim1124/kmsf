# Acceptance Matrix

이 문서는 `@kmsf/charts` 변경을 완료로 판단하기 위한 차트별 acceptance gate다.

## Command Gate

| Gate | Command | 포함 범위 |
| --- | --- | --- |
| 기본 패키지 검증 | `npm --workspace=@kmsf/charts run verify` | `lint`, `test:run`, `build` |
| 전체 패키지 검증 | `npm --workspace=@kmsf/charts run verify:full` | `lint`, `test:run`, `build`, `test:e2e` |
| 브라우저 검증 | `npm --workspace=@kmsf/charts run test:e2e` | Playwright desktop/mobile chart rendering |

## Chart Acceptance Matrix

| Chart | Data contract | Vitest gate | Playwright gate | Performance gate | Residual risk |
| --- | --- | --- | --- | --- | --- |
| `TrendChart` | `data`와 `series` 필수. row index `0`은 X 값, `1..n`은 `series` 순서에 매핑한다. | `normalizeTrendRows`, `buildTrendSeries`, realtime animation option, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, 1초 interval sample update, desktop/mobile nonblank canvas, resize. | 10,000+ point rendering은 `sampling: "lttb"`, symbol 비활성화, 불필요한 deep clone 회피를 기준으로 본다. | `updateDataAt` imperative patch의 대량 호출 예산은 별도 benchmark가 필요하다. |
| `TopChart` | `data` 필수. `series` 생략 시 기본 series를 생성한다. row index `0`은 category, `1..n`은 값이다. | `normalizeTopRows`, `buildTopSeries`, category label rotation heuristic, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, column mode canvas paint, resize. | category 수 증가 시 label overflow와 treemap/pie mode의 option 재생성 비용을 확인한다. | treemap 대량 node 시각 검증은 현재 예제 데이터보다 넓은 fixture가 필요하다. |
| `SankeyChart` | `data`와 `series`는 ECharts Sankey 공식 포맷을 따른다. | public API export, package contract, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, 10초 interval flow data update, nonblank canvas. | link/node 수 증가 시 layout 계산 비용과 canvas paint 유지 여부를 확인한다. | cycle 또는 invalid link 입력에 대한 사용자 오류 메시지는 별도 합의가 필요하다. |
| `WordCloud` | `data`와 `series`는 `echarts-wordcloud` 데이터 포맷을 따른다. | public API export, no Next.js runtime import, lazy-load import safety, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, browser-only extension load, nonblank canvas. | keyword 수 증가 시 layout 시간이 길어질 수 있으므로 대량 fixture가 필요하다. | SSR import safety는 현재 package import 중심이며 실제 framework SSR fixture는 후속이다. |
| `GuageChart` | `data` 필수. `series` 생략 시 기본 gauge series를 생성한다. `min`, `max`, `unit`은 간결 API로 제공한다. | public alias, numeric normalization, package contract, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, 5초 interval metric update, nonblank canvas. | 단일 지표 chart라 대량 데이터보다 반복 update와 option patch 안정성을 본다. | 요청 표기 호환 이름이므로 `GaugeChart` alias와 함께 유지해야 한다. |
| `SunbustChart` | `data` 필수. ECharts Sunburst `children` 계층 구조를 유지한다. | public alias, sunburst option defaults, package contract, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, 5초 interval hierarchy update, nonblank canvas. | 계층 depth와 node 수 증가 시 label overlap과 hover 가독성을 확인한다. | 요청 표기 호환 이름이므로 `SunburstChart` alias와 함께 유지해야 한다. |

## Completion Rule

- behavior 변경은 가장 작은 관련 Vitest 또는 Playwright 실패 테스트를 먼저 추가한다.
- browser-visible 변경은 Playwright로 desktop/mobile nonblank canvas와 console error absence를 확인한다.
- `verify:full`을 실행하지 못하면 blocker와 residual risk를 `test/reports/YYYY-MM-DD.md`에 남긴다.
- `Residual risk`가 남은 항목은 완료 보고에서 숨기지 않는다.
