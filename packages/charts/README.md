# @kmsf/charts

`@kmsf/charts`는 KMSF 보일러플레이트 사용자가 React 애플리케이션에서 바로 사용할 수 있는 ECharts 기반 차트 컴포넌트 패키지다.

이 패키지는 Next.js 전용 API에 의존하지 않으며, Vite 기반 라이브러리 빌드를 기본 개발 환경으로 사용한다.

## Target Components

- `GenericChart`: `type` 기반 ECharts 범용 차트
- `TrendChart`: Line, Area 추이 차트
- `TopChart`: Pie, Bar, Column, Treemap 기반 TOP N 차트
- `SankeyChart`: ECharts Sankey 옵션 기반 흐름 차트
- `WordCloud`: `echarts-wordcloud` 확장 기반 워드 클라우드
- `GaugeChart`: 간결화된 Gauge 차트
- `SunburstChart`: 계층형 Pie 차트
- `RadarChart`, `HeatmapChart`, `GraphChart`: native required 차트를 쉽게 쓰기 위한 얇은 wrapper

## Package Rules

- `react`, `react-dom`은 peer dependency로 유지한다.
- `echarts`, `dayjs`, `echarts-wordcloud`는 런타임 dependency로 둔다.
- 차트 옵션 커스터마이징은 ECharts 공식 옵션 범위 안에서만 노출한다.
- 대용량 데이터와 실시간 갱신을 고려해 불필요한 deep clone과 전체 재생성을 피한다.

## Local Commands

```bash
npm --workspace=@kmsf/charts run lint
npm --workspace=@kmsf/charts run test:run
npm --workspace=@kmsf/charts run build
npm --workspace=@kmsf/charts run test:e2e
npm --workspace=@kmsf/charts run test:soak -- --duration 5
npm --workspace=@kmsf/charts run test:soak -- --duration 3600 --interval 10 --grep "line live chart performance"
```

The example dev server uses port `4000` by default. If the port is already in use, choose the next available port explicitly:

```bash
KMSF_CHARTS_PORT=4001 npm --workspace=@kmsf/charts run dev
KMSF_CHARTS_PORT=4001 npm --workspace=@kmsf/charts run test:e2e
```

현재 1차 구현 기준으로 공통 데이터 정규화, 옵션 병합, 예제 렌더링 검증까지 포함되어 있다.

## Quick Start

```tsx
import { TrendChart, TopChart, createTopRows, createTrendRows } from "@kmsf/charts";

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

## Loading Fallback

차트 최초 렌더링 전 또는 `wordCloud` 확장 로딩 중에는 `loadingFallback`으로 Skeleton을 전달할 수 있다. `@kmsf/charts`는 shadcn을 직접 의존하지 않으므로, Skeleton UI는 사용하는 앱의 shadcn 컴포넌트를 전달한다.

```tsx
import { GenericChart } from "@kmsf/charts";
import { Skeleton } from "@/components/ui/skeleton";

function ChartLoadingSkeleton() {
  return <Skeleton className="h-full w-full rounded-md" />;
}

export function RevenueChart() {
  return (
    <GenericChart
      data={[["Alpha", 120]]}
      dataFormat="top"
      loadingFallback={<ChartLoadingSkeleton />}
      type="bar"
    />
  );
}
```

## Theme Override

KMSF provides a default TOP palette. Consumers can pass `colors?: string[]` for fixed hex colors, or override palette, text, and background without changing package source.

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

`colors` has priority over `themeOverrides.palette`. Empty or invalid `colors` falls back to the KMSF TOP palette. `options` is still merged after the default chart option, so ECharts-native overrides remain available.

## Runtime Validation

`data` is required for every chart. `TrendChart` additionally requires `series` because trend row value columns are mapped to `series[0..n-1]`. Missing required chart settings stop chart rendering and show a chart-local fallback UI. A `[KMSF Charts]` console error is logged once for the same issue.

Chart-specific ECharts settings are validated before rendering for native-required types such as `radar`, `heatmap`, `lines`, `graph`, `boxplot`, `parallel`, `sankey`, and `themeRiver`. `map` and `custom` remain advanced charts that require official ECharts setup, such as map resource registration or `renderItem`.

The example and Playwright tests intentionally trigger some invalid configurations, such as a missing `options.radar.indicator`, to verify that the fallback UI protects the host app.

## Public API Notes

- `GaugeChart`와 `SunburstChart`를 public chart 이름으로 사용한다.
- `RadarChart`, `HeatmapChart`, `GraphChart`는 `GenericChart`에 필요한 native option을 주입하는 wrapper다.
- tuple 포맷을 직접 만들 수 있지만, 처음 사용하는 개발자는 `createTrendRows`, `createTopRows`를 우선 사용한다.
- `WordCloud`는 browser-only extension인 `echarts-wordcloud`를 내부에서 lazy load하므로, 패키지 import 자체는 SSR 환경에서도 깨지지 않아야 한다.
- 예제 페이지의 `Large Data` 탭은 10,000개 line row와 1,000개 bar item을 별도 메뉴에서 생성해 기본 예제 탐색 성능과 분리한다.

## Documentation

- 요구사항: `docs/01-requirements.md`
- 아키텍처: `docs/02-architecture.md`
- 컴포넌트 API 초안: `docs/03-component-api-draft.md`
- 빠른 시작: `docs/06-quick-start.md`
- 검증 전략: `docs/04-verification-strategy.md`
- 미확정 사항: `docs/05-open-questions.md`
- Superpowers 작업 지침: `docs/superpowers/2026-04-25-kmsf-charts-guidelines.md`
