# @kmsf/charts Requirements

## 목표

KMSF 보일러플레이트를 사용하는 개발자가 Next.js 전용 API 없이 일반 React 애플리케이션에서도 ECharts 기반 차트를 사용할 수 있는 패키지를 제공한다.

## 기술 스택

- React
- ECharts
- TypeScript
- Vite
- Vitest
- Playwright
- Day.js
- `echarts-wordcloud`

## Public Components

- `GenericChart`: `type` 기반 범용 ECharts wrapper
- `TrendChart`: line/area 추이 차트 전용 wrapper
- `TopChart`: pie/bar/column/treemap TOP N 차트 전용 wrapper
- `SankeyChart`: Sankey 흐름 차트 wrapper
- `WordCloud`: `echarts-wordcloud` 기반 워드 클라우드 wrapper
- `GaugeChart`: gauge 지표 차트 wrapper
- `SunburstChart`: sunburst 계층 차트 wrapper
- `RadarChart`: radar 필수 설정을 단순화한 native-required wrapper
- `HeatmapChart`: heatmap 필수 설정을 단순화한 native-required wrapper
- `GraphChart`: graph 필수 설정을 단순화한 native-required wrapper

`GuageChart`, `SunbustChart`는 public export가 아니다.

## GenericChart Types

`GenericChart`는 `supportedGenericChartTypes` 기준으로 아래 타입을 지원한다.

- `bar`
- `line`
- `pie`
- `scatter`
- `effectScatter`
- `candlestick`
- `radar`
- `heatmap`
- `tree`
- `treemap`
- `sunburst`
- `map`
- `lines`
- `graph`
- `boxplot`
- `parallel`
- `gauge`
- `funnel`
- `sankey`
- `themeRiver`
- `pictorialBar`
- `custom`
- `wordCloud`

`map`과 `custom`은 고급 차트로 분류하며 지도 리소스 등록 또는 `renderItem` 구현은 ECharts 공식 문서를 따른다.

## Common Props

- `data`: 모든 차트의 필수 데이터 prop.
- `series`: ECharts series 객체 배열. `TrendChart`는 필수이며, 다른 차트는 안전한 경우 기본 series를 생성한다.
- `colors`: 유효한 16진수 색상 배열. 값이 없거나 모두 유효하지 않으면 KMSF mint 계열 TOP palette를 사용한다.
- `legend`: `boolean | LegendComponentOption`. 차트 타입별 기본값과 scroll/ellipsis layout 기본값을 적용한다.
- `tooltip`: `boolean | TooltipComponentOption`.
- `xAxis`, `yAxis`: ECharts axis option 또는 option 배열.
- `options`: ECharts 전체 option override.
- `seriesOptions`: KMSF가 생성한 series option의 일부 override.
- `labelContraction`: 숫자 라벨 천 단위 콤마 적용 여부.
- `theme`: `"light" | "dark" | string`.
- `themeOverrides`: `backgroundColor`, `fontFamily`, `fontSize`, `palette`, `textColor` override.
- `loadingFallback`: 최초 렌더링 전 또는 `wordCloud` 확장 로딩 중 표시할 React node.
- `height`, `className`, `style`: chart container 표현 제어.

사용자가 전달한 `legend`, `seriesOptions`, `options`는 KMSF 기본값보다 우선한다.

## Data Contracts

- Trend row: `[time, value1, value2, ...]`
- Top row: `[name, value1, value2, ...]`
- Native-required chart: ECharts 공식 data/series 구조를 따른다.

`time`은 `YYYY-MM-DD HH:mm:ss` 문자열 또는 `Date` 객체를 허용한다.

## Runtime Requirements

- 브라우저 반응형 resize를 지원한다.
- 반복 data/options 갱신을 지원한다.
- 차트 type 변경 시 stale ECharts option을 피하도록 type별 remount 경로를 유지한다.
- `data` 또는 chart-specific 필수 설정이 없으면 ECharts 인스턴스를 만들지 않고 chart-local fallback UI를 표시한다.
- validation issue는 chart-local fallback UI 또는 editor alert로 표시하며 browser console warning/error를 발생시키지 않는다.
- 10,000개 이상 데이터와 반복 갱신을 baseline 요구사항으로 본다.
- `TrendChart` line series는 기본 `smooth: true`, `sampling: "lttb"`, `showSymbol: false`를 적용한다.

## Example Requirements

- renderable chart type은 각 5개 예제를 제공한다.
- live/variant 예제는 기본 3 series를 제공한다.
- `pie`, `treemap`, `gauge`, `funnel`, `wordCloud`, `sunburst`, `themeRiver`는 single-series 예제로 유지한다.
- line live 예제는 1초 간격, 1분 window, 60 row를 사용한다.
- TOP 계열 live 예제는 5초 간격으로 갱신한다.
- 예제 검색은 chart option, chart example, chart docs 문구를 대상으로 한다.
- inactive chart type은 검색 결과 생성을 위해 ECharts instance를 만들지 않는다.

## Verification Requirements

- 패키지 기본 검증은 `npm --workspace=@kmsf/charts run verify`를 사용한다.
- 브라우저 포함 전체 gate는 `npm --workspace=@kmsf/charts run verify:full`을 사용한다.
- 장시간/대용량 검증은 요청 시 `test:soak` 또는 large data Playwright gate로 별도 실행한다.
