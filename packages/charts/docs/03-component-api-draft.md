# Component API

이 문서는 현재 public API 기준이다. dated plan/spec 문서에 남아 있는 과거 compatibility 문구보다 `src/index.ts` export와 이 문서를 우선한다.

## Public Exports

- `GenericChart`
- `TrendChart`
- `TopChart`
- `SankeyChart`
- `WordCloud`
- `GaugeChart`
- `SunburstChart`
- `RadarChart`
- `HeatmapChart`
- `GraphChart`
- `createTrendRows`
- `createTopRows`
- `supportedGenericChartTypes`
- `buildGenericChartOption`
- `resolveGenericDataFormat`

`GuageChart`, `SunbustChart`는 public export가 아니다.

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
    fontFamily?: string;
    fontSize?: number;
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

`colors`는 16진수 문자열 배열만 받는다. 유효한 `colors`가 있으면 `themeOverrides.palette`보다 우선하고, 없거나 모두 유효하지 않으면 KMSF mint 계열 TOP 10 palette로 fallback한다.

`legend`는 `boolean | LegendComponentOption`을 받는다. `bar`, `pictorialBar`, `treemap`, `gauge`, `sankey`, `heatmap`, `funnel`, `sunburst`, `wordCloud`와 `TopChart`의 `bar`/`column`/`treemap` mode는 기본값이 `false`다. `pie`는 기본값이 `true`이며 오른쪽 세로 scroll legend와 왼쪽으로 이동한 pie center/radius 기본값을 적용한다. `pie`, `funnel`, `sunburst`, `treemap`, `wordCloud`처럼 데이터 항목이 범례가 되는 차트는 `legend={true}` 또는 legend 객체를 전달하면 `type: "scroll"`과 `textStyle.overflow: "truncate"` 기본값을 병합한다. `radar`는 legend 표시 시 radar `center`/`radius` 기본값을 조정해 legend와 chart 간격을 확보한다. 사용자가 전달한 legend 객체, `seriesOptions`, `options`가 KMSF 기본값보다 우선한다.

Visible legend의 기본 icon은 채워진 `circle`이다. 사용자가 `legend.icon`을 전달하면 사용자 값이 우선한다.

`options.title.text` 또는 `options.title.subtext`가 있으면 KMSF는 chart type별 layout 기본값을 조정해 title, subtitle, legend, chart drawing area가 겹치지 않도록 한다. Axis chart는 `grid.top`, radar/parallel/themeRiver/structural chart는 해당 ECharts layout 옵션이나 series layout 기본값을 조정한다. 사용자가 전달한 `legend`, `seriesOptions`, `options`가 최종 override이므로 사용자가 직접 layout 값을 제어할 수 있다. title/subtitle 기본값은 빈 문자열이다.

TOP single-series tooltip은 기본 formatter에서 `Item N` 라벨을 사용한다. `tooltip.formatter`를 전달하면 사용자 formatter가 우선한다.

`pie`와 `funnel`은 기본 label을 숨긴다. `seriesOptions.label` 또는 `options.series`로 다시 표시할 수 있다.

공통 필수 prop은 `data`다. `TrendChart`는 `series`도 필수다. 필수 설정이 누락된 chart는 ECharts 인스턴스를 만들지 않고 chart-local fallback UI를 표시한다. validation issue는 browser console warning/error 없이 UI 상태로 표시한다.

`loadingFallback`은 최초 ECharts instance 생성과 첫 `setOption` 적용 전까지 표시할 ReactNode다. `wordCloud`는 `echarts-wordcloud` 확장 로딩 중에도 이 fallback을 표시한다. validation 실패 시에는 `loadingFallback` 대신 chart-local fallback UI를 표시하고, 실시간 data/options update마다 loading fallback을 다시 표시하지 않는다.

Native-required chart는 KMSF 필수 prop만으로는 충분하지 않은 ECharts 설정을 함께 검사한다. 예를 들어 `radar`는 `options.radar.indicator`, `heatmap`은 `xAxis`, `yAxis`, `visualMap`, `sankey`와 `graph`는 `series[].links`가 필요하다. `map`과 `custom`은 고급 차트로 분류하며, 지도 리소스 등록 또는 `renderItem` 구현은 공식 문서를 따른다.

## GenericChart

```ts
export type GenericChartDataFormat = "auto" | "native" | "top" | "trend";

export type KmsfChartType =
  | "bar"
  | "line"
  | "pie"
  | "scatter"
  | "effectScatter"
  | "candlestick"
  | "radar"
  | "heatmap"
  | "tree"
  | "treemap"
  | "sunburst"
  | "map"
  | "lines"
  | "graph"
  | "boxplot"
  | "parallel"
  | "gauge"
  | "funnel"
  | "sankey"
  | "themeRiver"
  | "pictorialBar"
  | "custom"
  | "wordCloud";

export interface GenericChartProps {
  type: KmsfChartType;
  data: unknown;
  dataFormat?: GenericChartDataFormat;
  series?: SeriesOption[];
  seriesOptions?: Partial<SeriesOption> | Partial<SeriesOption>[];
  options?: EChartsOption;
}
```

`dataFormat="top"`은 `[name, value1, value2, ...]`, `dataFormat="trend"`는 `[time, value1, value2, ...]` tuple을 사용한다. `dataFormat="native"`는 ECharts 공식 series data 구조를 그대로 사용한다.

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
- 기본 line series는 `smooth: true`, `sampling: "lttb"`, `showSymbol: false`를 적용한다.

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
- `mode="pie"`는 legend 기본값이 `true`이며 오른쪽 scroll legend와 왼쪽 pie center를 기본 적용한다.
- `mode="pie"`는 기본 label을 숨기고 TOP tooltip에 `Item N` 라벨을 사용한다.

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
