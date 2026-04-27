# Component API

## 공통 타입

```ts
import type {
  EChartsOption,
  LegendComponentOption,
  SeriesOption,
  TooltipComponentOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";

export type KmsfLegendOption = boolean | LegendComponentOption;
export type KmsfTooltipOption = boolean | TooltipComponentOption;
export type KmsfAxisOption<T> = T | T[];

export interface KmsfBaseChartProps<TData> {
  data: TData;
  series?: SeriesOption[];
  legend?: KmsfLegendOption;
  xAxis?: KmsfAxisOption<XAXisComponentOption>;
  yAxis?: KmsfAxisOption<YAXisComponentOption>;
  options?: EChartsOption;
  seriesOptions?: Partial<SeriesOption> | Partial<SeriesOption>[];
  labelContraction?: boolean;
  tooltip?: KmsfTooltipOption;
  theme?: "light" | "dark" | string;
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
}
```

현재 구현은 ECharts 5.6.0 타입 기준으로 검증했다.

## 데이터 Helper

```ts
export interface TrendRowInput {
  x: string | Date;
  value?: number | null;
  values?: Array<number | null>;
}

export interface TopRowInput {
  name: string;
  value?: number | null;
  values?: Array<number | null>;
}

export function createTrendRows(rows: TrendRowInput[]): TrendChartRow[];
export function createTopRows(rows: TopRowInput[]): TopChartRow[];
```

## TrendChart

```ts
export type TrendChartMode = "line" | "area";
export type TrendChartRow = [string | Date, ...Array<number | null>];

export interface TrendChartProps extends KmsfBaseChartProps<TrendChartRow[]> {
  series: SeriesOption[];
  mode?: TrendChartMode;
  onBeforeZoom?: (payload: unknown) => void;
  onAfterZoom?: (payload: unknown) => void;
}
```

데이터 매핑:

- row `0`: X축 시간 값
- row `1..n`: `series[0..n-1]`에 매핑되는 값

## TopChart

```ts
export type TopChartMode = "pie" | "bar" | "column" | "treemap";
export type TopChartRow = [string, ...Array<number | null>];

export interface TopChartProps extends KmsfBaseChartProps<TopChartRow[]> {
  mode?: TopChartMode;
}
```

데이터 매핑:

- row `0`: category
- row `1..n`: `series[0..n-1]`에 매핑되는 값
- `series` 생략 시 기본 series 1개를 생성한다.

## SankeyChart

```ts
export interface SankeyChartProps extends KmsfBaseChartProps<unknown> {
  series: SeriesOption[];
}
```

Sankey 데이터는 ECharts 공식 Sankey series 포맷을 유지한다.

## WordCloud

```ts
export interface WordCloudProps extends KmsfBaseChartProps<unknown> {
  series: SeriesOption[];
}
```

WordCloud는 `echarts-wordcloud` 확장을 등록한 뒤 ECharts option을 생성한다.

## GuageChart

```ts
export interface GuageChartProps extends KmsfBaseChartProps<unknown> {
  min?: number;
  max?: number;
  unit?: string;
}
```

Gauge 계열 상세 옵션은 `seriesOptions`와 `options`로 열어두고, 기본 API는 `data`, `series`, `min`, `max`, `unit` 중심으로 유지한다.

`GaugeChart`는 `GuageChart`의 alias다. 외부 문서에서는 `GaugeChart`를 우선 사용한다.

## SunbustChart

```ts
export interface SunbustChartProps extends KmsfBaseChartProps<unknown> {
  radius?: string | [string, string];
}
```

Sunburst 계층 데이터는 ECharts 공식 `children` 구조를 유지한다.

`SunburstChart`는 `SunbustChart`의 alias다. 외부 문서에서는 `SunburstChart`를 우선 사용한다.
