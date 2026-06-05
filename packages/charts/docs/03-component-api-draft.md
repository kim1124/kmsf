# Component API

## 공통 타입

```ts
import type { CSSProperties, ReactNode } from "react";
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
  colors?: string[];
  legend?: KmsfLegendOption;
  xAxis?: KmsfAxisOption<XAXisComponentOption>;
  yAxis?: KmsfAxisOption<YAXisComponentOption>;
  options?: EChartsOption;
  seriesOptions?: Partial<SeriesOption> | Partial<SeriesOption>[];
  labelContraction?: boolean;
  tooltip?: KmsfTooltipOption;
  theme?: "light" | "dark" | string;
  themeOverrides?: {
    backgroundColor?: string;
    palette?: string[];
    textColor?: string;
  };
  loadingFallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
  height?: number | string;
}
```

현재 구현은 ECharts 5.6.0 타입 기준으로 검증했다.

`colors`는 16진수 문자열 배열만 받는다. 유효한 `colors`가 있으면 `themeOverrides.palette`보다 우선하고, 없거나 모두 유효하지 않으면 KMSF TOP palette로 fallback한다.

공통 필수 prop은 `data`다. `TrendChart`는 `series`도 필수다. 필수 설정이 누락된 chart는 ECharts 인스턴스를 만들지 않고 chart-local fallback UI를 표시한다. 동일 issue는 `[KMSF Charts]` prefix로 console에 1회 기록한다.

`loadingFallback`은 최초 ECharts instance 생성과 첫 `setOption` 적용 전까지 표시할 ReactNode다. `wordCloud`는 `echarts-wordcloud` 확장 로딩 중에도 이 fallback을 표시한다. validation 실패 시에는 `loadingFallback` 대신 chart-local fallback UI를 표시하고, 실시간 data/options update마다 loading fallback을 다시 표시하지 않는다.

Native-required chart는 KMSF 필수 prop만으로는 충분하지 않은 ECharts 설정을 함께 검사한다. 예를 들어 `radar`는 `options.radar.indicator`, `heatmap`은 `xAxis`, `yAxis`, `visualMap`, `sankey`와 `graph`는 `series[].links`가 필요하다. `map`과 `custom`은 고급 차트로 분류하며, 지도 리소스 등록 또는 `renderItem` 구현은 공식 문서를 따른다.

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
export interface SankeyLink {
  source: string;
  target: string;
  value?: number;
}

export interface SankeyChartProps extends KmsfBaseChartProps<unknown> {
  links?: SankeyLink[];
}
```

Sankey 데이터는 ECharts 공식 Sankey series 포맷을 유지한다. `series[].links` 또는 `links`가 없으면 렌더링을 중지하고 fallback을 표시한다.

## WordCloud

```ts
export interface WordCloudProps extends KmsfBaseChartProps<unknown> {
  series?: SeriesOption[];
}
```

WordCloud는 `echarts-wordcloud` 확장을 등록한 뒤 ECharts option을 생성한다. `series`를 생략하면 기본 wordCloud series를 생성하고 `data`를 연결한다. 색상은 `colors`가 있으면 `dataIndex` 기준으로 적용하고, 없으면 KMSF TOP palette를 사용한다.

## GaugeChart

```ts
export interface GaugeChartProps extends KmsfBaseChartProps<unknown> {
  min?: number;
  max?: number;
  unit?: string;
}
```

Gauge 계열 상세 옵션은 `seriesOptions`와 `options`로 열어두고, 기본 API는 `data`, `series`, `min`, `max`, `unit` 중심으로 유지한다.

## SunburstChart

```ts
export interface SunburstChartProps extends KmsfBaseChartProps<unknown> {
  radius?: string | [string, string];
}
```

Sunburst 계층 데이터는 ECharts 공식 `children` 구조를 유지한다.

## Native Required Wrappers

```ts
export interface RadarChartProps extends Omit<GenericChartProps, "dataFormat" | "options" | "type"> {
  indicators: Array<{ name: string; max?: number; min?: number; color?: string }>;
  options?: EChartsOption;
}

export interface HeatmapChartProps extends Omit<GenericChartProps, "dataFormat" | "options" | "type"> {
  xAxisData: Array<string | number>;
  yAxisData: Array<string | number>;
  visualMap?: EChartsOption["visualMap"];
  options?: EChartsOption;
}

export interface GraphChartProps extends Omit<GenericChartProps, "data" | "dataFormat" | "options" | "series" | "type"> {
  data?: unknown;
  nodes: Array<{ name: string; value?: number; x?: number; y?: number }>;
  links: Array<{ source: string; target: string; value?: number }>;
  layout?: "none" | "circular" | "force";
  options?: EChartsOption;
  series?: SeriesOption[];
}
```

이 wrapper들은 `GenericChart`에 `type="radar" | "heatmap" | "graph"`와 `dataFormat="native"`를 주입하고, 각 차트가 필수로 요구하는 option 또는 series 필드를 구성한다.
