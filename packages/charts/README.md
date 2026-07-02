# @kmsf/charts

`@kmsf/charts`는 React 애플리케이션에서 사용할 수 있는 ECharts 기반 chart component package다. Next.js 전용 API에 의존하지 않고 Vite library build를 기준으로 개발한다.

## 제공 컴포넌트

- `GenericChart`: `type` 기반 ECharts 범용 차트
- `TrendChart`: line/area 추이 차트
- `TopChart`: pie/bar/column/treemap 기반 TOP N 차트
- `GaugeChart`
- `SunburstChart`
- `SankeyChart`
- `WordCloud`
- `RadarChart`
- `HeatmapChart`
- `GraphChart`

## 빠른 시작

```tsx
import { TopChart, TrendChart, createTopRows, createTrendRows } from "@kmsf/charts";

const trendSeries = [{ id: "sales", name: "Sales" }];
const trendData = createTrendRows([
  { x: "2026-04-26 10:00:00", value: 1000 },
  { x: "2026-04-26 11:00:00", value: 1400 },
]);

const topData = createTopRows([
  { name: "A", value: 100 },
  { name: "B", value: 200 },
]);

export function Dashboard() {
  return (
    <>
      <TrendChart data={trendData} mode="area" series={trendSeries} />
      <TopChart data={topData} mode="column" />
    </>
  );
}
```

## 구현된 기능

- 공통 data normalizer와 ECharts option builder
- `createTrendRows`, `createTopRows` helper
- light/dark theme와 palette override
- `colors` prop 기반 고정 색상 override
- `loadingFallback` slot
- chart-local validation fallback
- native-required chart wrapper: Radar, Heatmap, Graph
- browser-only `echarts-wordcloud` lazy load
- large data example 분리
- Playwright 기반 nonblank canvas, resize, chart switching 검증

## Theme override

```tsx
<TrendChart
  colors={["#10b981", "#0ea5e9", "#f97316"]}
  data={rows}
  series={series}
  theme="light"
  themeOverrides={{
    palette: ["#2563eb", "#9333ea"],
    textColor: "#0f172a",
  }}
/>
```

`colors`는 `themeOverrides.palette`보다 우선한다. 최종 `options`는 KMSF 기본 option 뒤에 병합되므로 ECharts native override도 가능하다.

## Runtime validation

- 모든 chart는 `data`를 필요로 한다.
- `TrendChart`는 `series`를 추가로 필요로 한다.
- native-required chart는 필요한 ECharts option이 없으면 chart-local fallback UI를 표시한다.
- `map`과 `custom`은 map resource registration 또는 `renderItem` 같은 공식 ECharts setup이 필요한 advanced chart로 유지한다.

## Playground

루트에서 실행:

```bash
npm --workspace=@kmsf/charts run dev
```

기본 포트는 `4000`이다. 포트 변경:

```bash
KMSF_CHARTS_PORT=4001 npm --workspace=@kmsf/charts run dev
```

## 검증

```bash
npm --workspace=@kmsf/charts run lint
npm --workspace=@kmsf/charts run test:run
npm --workspace=@kmsf/charts run build
npm --workspace=@kmsf/charts run test:e2e
npm --workspace=@kmsf/charts run verify
npm --workspace=@kmsf/charts run verify:full
npm --workspace=@kmsf/charts run test:soak -- --duration 5
```

## 문서

- 요구사항: `docs/01-requirements.md`
- 아키텍처: `docs/02-architecture.md`
- API 초안: `docs/03-component-api-draft.md`
- 검증 전략: `docs/04-verification-strategy.md`
- 미확정 사항: `docs/05-open-questions.md`
- 빠른 시작: `docs/06-quick-start.md`
- 수용 기준: `docs/07-acceptance-matrix.md`
