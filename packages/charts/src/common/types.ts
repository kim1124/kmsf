import type { CSSProperties, ReactNode } from "react";
import type {
  EChartsOption,
  LegendComponentOption,
  SeriesOption,
  TooltipComponentOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";

export type PrimitiveChartValue = string | number | Date | null;
export type KmsfChartTheme = "light" | "dark" | string;
export type KmsfLegendOption = boolean | LegendComponentOption;
export type KmsfTooltipOption = boolean | TooltipComponentOption;
export type KmsfAxisOption<TAxis> = TAxis | TAxis[];
export type SeriesOverride = Partial<SeriesOption> | Array<Partial<SeriesOption>>;

export interface KmsfChartThemeOverrides {
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  palette?: string[];
  textColor?: string;
}

export interface KmsfBaseChartProps<TData> {
  data: TData;
  series?: SeriesOption[];
  colors?: string[];
  legend?: KmsfLegendOption;
  xAxis?: KmsfAxisOption<XAXisComponentOption>;
  yAxis?: KmsfAxisOption<YAXisComponentOption>;
  options?: EChartsOption;
  seriesOptions?: SeriesOverride;
  labelContraction?: boolean;
  tooltip?: KmsfTooltipOption;
  theme?: KmsfChartTheme;
  themeOverrides?: KmsfChartThemeOverrides;
  loadingFallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
  height?: number | string;
}

export type TrendChartMode = "line" | "area";
export type TrendChartRow = [string | Date, ...Array<number | null>];
export type TopChartMode = "pie" | "bar" | "column" | "treemap";
export type TopChartRow = [string, ...Array<number | null>];

export interface NormalizedTrendData {
  xAxisData: string[];
  seriesValues: Array<Array<number | null>>;
}

export interface NormalizedTopData {
  categories: string[];
  seriesValues: Array<Array<number | null>>;
}
