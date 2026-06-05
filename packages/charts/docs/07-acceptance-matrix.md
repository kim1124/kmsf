# Acceptance Matrix

이 문서는 `@kmsf/charts` 변경을 완료로 판단하기 위한 차트별 acceptance gate다.

## Command Gate

| Gate | Command | 포함 범위 |
| --- | --- | --- |
| 기본 패키지 검증 | `npm --workspace=@kmsf/charts run verify` | `lint`, `test:run`, `build` |
| 전체 패키지 검증 | `npm --workspace=@kmsf/charts run verify:full` | `lint`, `test:run`, `build`, `test:e2e` |
| 브라우저 검증 | `npm --workspace=@kmsf/charts run test:e2e` | Playwright desktop/mobile chart rendering |
| 장시간 갱신 검증 | `npm --workspace=@kmsf/charts run test:soak -- --duration <seconds> --interval <seconds> --grep "<target>"` | 추이 chart 또는 all implemented chart type 반복 갱신, CDP memory/performance metric, card-level canvas layer 분류, console/pageerror absence |
| 대용량 예제 검증 | `npm --workspace=@kmsf/charts run test:e2e -- test/playwright/specs/example.spec.ts --project=chromium -g "large data examples"` | 별도 `Large Data` 메뉴, 10,000개 line row, 1,000개 bar item, nonblank canvas, console/pageerror absence |

## Chart Acceptance Matrix

| Chart | Data contract | Vitest gate | Playwright gate | Performance gate | Residual risk |
| --- | --- | --- | --- | --- | --- |
| `GenericChart` | `type` 필수. `dataFormat`은 `auto`, `top`, `trend`, `native`를 지원한다. `seriesOptions`와 `options` override 경로를 유지한다. | generic option builder, public API export, type/data format resolution, `verify:full` script contract. | 타입 메뉴 렌더링, chart type 전환, console/pageerror absence, nonblank canvas. | chart type 전환 시 stale ECharts option을 피하기 위해 type별 remount를 확인한다. | `map`, `custom`은 외부 리소스 또는 renderItem이 필요하므로 별도 fixture가 필요하다. |
| `TrendChart` | `data`와 `series` 필수. row index `0`은 X 값, `1..n`은 `series` 순서에 매핑한다. | `normalizeTrendRows`, `buildTrendSeries`, realtime animation option, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, 1초 interval sample update, desktop/mobile nonblank canvas, resize. | 10,000+ point rendering은 `sampling: "lttb"`, symbol 비활성화, 불필요한 deep clone 회피를 기준으로 본다. | `updateDataAt` imperative patch의 대량 호출 예산은 별도 benchmark가 필요하다. |
| `TopChart` | `data` 필수. `series` 생략 시 기본 series를 생성한다. row index `0`은 category, `1..n`은 값이다. | `normalizeTopRows`, `buildTopSeries`, category label rotation heuristic, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, column mode canvas paint, resize. | category 수 증가 시 label overflow와 treemap/pie mode의 option 재생성 비용을 확인한다. | treemap 대량 node 시각 검증은 현재 예제 데이터보다 넓은 fixture가 필요하다. |
| `SankeyChart` | `data`는 node 목록, `links` 또는 `series[].links`는 흐름 관계를 따른다. links 누락 시 fallback을 표시한다. | dedicated component validation, public API export, package contract, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, 10초 interval flow data update, nonblank canvas. | link/node 수 증가 시 layout 계산 비용과 canvas paint 유지 여부를 확인한다. | cycle 또는 invalid link 입력에 대한 사용자 오류 메시지는 별도 합의가 필요하다. |
| `WordCloud` | `data` 필수. `series` 생략 시 기본 wordCloud series를 생성한다. 색상은 `dataIndex` 기준으로 `colors` 또는 TOP palette를 적용한다. | public API export, no Next.js runtime import, lazy-load import safety, color helper, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, browser-only extension load, nonblank canvas. | keyword 수 증가 시 layout 시간이 길어질 수 있으므로 대량 fixture가 필요하다. | SSR import safety는 현재 package import 중심이며 실제 framework SSR fixture는 후속이다. |
| `GaugeChart` | `data` 필수. `series` 생략 시 기본 gauge series를 생성한다. `min`, `max`, `unit`은 간결 API로 제공한다. | public API export, numeric normalization, package contract, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, 5초 interval metric update, nonblank canvas. | 단일 지표 chart라 대량 데이터보다 반복 update와 option patch 안정성을 본다. | 오타 호환 export는 유지하지 않는다. |
| `SunburstChart` | `data` 필수. ECharts Sunburst `children` 계층 구조를 유지한다. | public API export, sunburst option defaults, package contract, `verify:full` script contract. | 예제 렌더링, 메뉴 전환, 5초 interval hierarchy update, nonblank canvas. | 계층 depth와 node 수 증가 시 label overlap과 hover 가독성을 확인한다. | 오타 호환 export는 유지하지 않는다. |
| `RadarChart` | `indicators`가 `options.radar.indicator`로 매핑된다. `data`는 ECharts radar series data를 따른다. | native wrapper public API export, validation issue coverage. | 예제 문서와 type playground에서 필수 option 누락 fallback을 확인한다. | 축 수 증가 시 label overlap과 polygon paint를 확인한다. | 복수 radar coordinate 설정은 공식 ECharts option으로 위임한다. |
| `HeatmapChart` | `xAxisData`, `yAxisData`, `visualMap`, `data`를 native heatmap option으로 매핑한다. | native wrapper public API export, validation issue coverage. | 전체 type smoke matrix에서 canvas render를 확인한다. | matrix size 증가 시 visualMap과 label 밀도를 확인한다. | calendar/geo heatmap은 공식 ECharts option으로 위임한다. |
| `GraphChart` | `nodes`, `links`, `layout`을 graph series로 매핑한다. | native wrapper public API export, validation issue coverage. | 전체 type smoke matrix에서 canvas render를 확인한다. | force layout node/link 증가 시 layout cost를 확인한다. | 대규모 graph interaction benchmark는 후속 fixture가 필요하다. |

## Common Runtime Rules

- `colors?: string[]`은 16진수 색상만 허용하며 `themeOverrides.palette`보다 우선한다.
- `colors`가 비어 있거나 모두 유효하지 않으면 KMSF TOP palette를 사용한다.
- 필수 설정 누락 시 ECharts 인스턴스를 만들지 않고 chart-local fallback UI를 표시한다.
- Playwright에서 의도적으로 발생시키는 invalid chart config는 host app 보호 검증용이다. 해당 console error는 테스트 expectation에 명시되어야 하며, 일반 렌더링 테스트에서는 console warning/error를 허용하지 않는다.
- `map`과 `custom`은 advanced chart로 분류하며, 공식 문서 기반 설정이 필요하다.

## Completion Rule

- behavior 변경은 가장 작은 관련 Vitest 또는 Playwright 실패 테스트를 먼저 추가한다.
- browser-visible 변경은 Playwright로 desktop/mobile nonblank canvas, card-level canvas layer 분류, console error absence를 확인한다.
- `verify:full`을 실행하지 못하면 blocker와 residual risk를 `packages/charts/reports/YYYY-MM-DD.md`에 남긴다.
- `Residual risk`가 남은 항목은 완료 보고에서 숨기지 않는다.
