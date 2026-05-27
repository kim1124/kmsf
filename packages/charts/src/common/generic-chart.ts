import dayjs from "dayjs";
import type {
  EChartsOption,
  LegendComponentOption,
  SeriesOption,
  TooltipComponentOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";

import {
  applySeriesOptions,
  buildBaseOption,
  buildCategoryAxis,
  buildValueAxis,
  normalizeAxisOption,
} from "./options";
import { buildThemeOption } from "./theme";
import type {
  KmsfAxisOption,
  KmsfChartTheme,
  KmsfChartThemeOverrides,
  KmsfLegendOption,
  KmsfTooltipOption,
  SeriesOverride,
} from "./types";

export const supportedGenericChartTypes = [
  "bar",
  "line",
  "pie",
  "scatter",
  "effectScatter",
  "candlestick",
  "radar",
  "heatmap",
  "tree",
  "treemap",
  "sunburst",
  "map",
  "lines",
  "graph",
  "boxplot",
  "parallel",
  "gauge",
  "funnel",
  "sankey",
  "themeRiver",
  "pictorialBar",
  "custom",
  "wordCloud",
] as const;

export type KmsfChartType = (typeof supportedGenericChartTypes)[number];
export type GenericChartDataFormat = "auto" | "native" | "top" | "trend";
export type GenericChartDataRow = [string | number | Date, ...unknown[]];

export interface BuildGenericChartOptionInput {
  data: unknown;
  dataFormat?: GenericChartDataFormat;
  labelContraction?: boolean;
  legend?: KmsfLegendOption;
  options?: EChartsOption;
  series?: SeriesOption[];
  seriesOptions?: SeriesOverride;
  theme?: KmsfChartTheme;
  themeOverrides?: KmsfChartThemeOverrides;
  tooltip?: KmsfTooltipOption;
  type: KmsfChartType;
  xAxis?: KmsfAxisOption<XAXisComponentOption>;
  yAxis?: KmsfAxisOption<YAXisComponentOption>;
}

const nativeOnlyTypes = new Set<KmsfChartType>([
  "boxplot",
  "candlestick",
  "custom",
  "graph",
  "heatmap",
  "lines",
  "map",
  "parallel",
  "radar",
  "sankey",
  "sunburst",
  "themeRiver",
  "tree",
]);

const topPreferredTypes = new Set<KmsfChartType>([
  "funnel",
  "gauge",
  "pie",
  "treemap",
  "wordCloud",
]);

const trendPreferredTypes = new Set<KmsfChartType>(["effectScatter", "line", "scatter"]);
const axisTopTypes = new Set<KmsfChartType>(["bar", "pictorialBar"]);

function isTimeLike(value: unknown): boolean {
  return value instanceof Date || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value));
}

function toDisplayValue(value: string | number | Date): string | number {
  if (value instanceof Date) {
    return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
  }

  return value;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function isTupleRow(value: unknown): value is GenericChartDataRow {
  return Array.isArray(value) && value.length >= 2;
}

function getTupleRows(data: unknown): GenericChartDataRow[] {
  if (!Array.isArray(data)) {
    return [];
  }

  if (data.length === 0) {
    return [];
  }

  if (data.every(isTupleRow)) {
    return data;
  }

  if (isTupleRow(data)) {
    return [data];
  }

  return [];
}

function getValueColumnCount(rows: GenericChartDataRow[]): number {
  return Math.max(
    1,
    rows.reduce((max, row) => Math.max(max, row.length - 1 - (getRowMetadata(row) ? 1 : 0)), 0),
  );
}

function buildDefaultSeries(series: SeriesOption[] | undefined, count: number): SeriesOption[] {
  if (series?.length) {
    return series;
  }

  return Array.from({ length: count }, (_, index) => ({ name: `Series ${index + 1}` }));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function getRowMetadata(row: GenericChartDataRow): Record<string, unknown> | undefined {
  const lastValue = row[row.length - 1];

  return isPlainObject(lastValue) ? lastValue : undefined;
}

function buildLegendWithDefaultIcon(
  legend: KmsfLegendOption | undefined,
  icon: LegendComponentOption["icon"],
): KmsfLegendOption {
  if (legend === false) {
    return false;
  }

  if (legend === undefined || legend === true) {
    return { icon };
  }

  return { icon, ...legend };
}

export function resolveGenericDataFormat(
  type: KmsfChartType,
  dataFormat: GenericChartDataFormat = "auto",
  data: unknown,
): Exclude<GenericChartDataFormat, "auto"> {
  if (dataFormat !== "auto") {
    return dataFormat;
  }

  if (nativeOnlyTypes.has(type)) {
    return "native";
  }

  if (topPreferredTypes.has(type)) {
    return "top";
  }

  if (trendPreferredTypes.has(type)) {
    return "trend";
  }

  if (axisTopTypes.has(type)) {
    const firstRow = getTupleRows(data)[0];

    return firstRow && isTimeLike(firstRow[0]) ? "trend" : "top";
  }

  return "native";
}

function buildTopSeries(input: BuildGenericChartOptionInput, rows: GenericChartDataRow[]): SeriesOption[] {
  const columnCount = getValueColumnCount(rows);
  const baseSeries = buildDefaultSeries(input.series, input.type === "gauge" ? 1 : columnCount);
  const categories = rows.map((row) => String(row[0]));

  return baseSeries.map((seriesItem, seriesIndex) => {
    const values = rows.map((row) => toNumberOrNull(row[seriesIndex + 1]));

    if (input.type === "gauge") {
      return {
        ...seriesItem,
        data: seriesItem.data ?? [{ name: categories[0] ?? "Value", value: values[0] ?? 0 }],
        type: "gauge",
      } as SeriesOption;
    }

    if (input.type === "bar" || input.type === "pictorialBar") {
      return {
        ...seriesItem,
        data:
          seriesItem.data ??
          rows.map((row, valueIndex) => {
            const metadata = getRowMetadata(row);
            const value = values[valueIndex] ?? null;

            return metadata ? { ...metadata, value } : value;
          }),
        type: input.type,
      } as SeriesOption;
    }

    return {
      ...seriesItem,
      data:
        seriesItem.data ??
        categories.map((name, categoryIndex) => ({
          ...(getRowMetadata(rows[categoryIndex]!) ?? {}),
          name,
          value: values[categoryIndex] ?? null,
        })),
      type: input.type,
    } as SeriesOption;
  });
}

function inferTooltipTrigger(
  type: KmsfChartType,
  format: Exclude<GenericChartDataFormat, "auto">,
): TooltipComponentOption["trigger"] {
  if (format === "trend" || (format === "top" && (type === "bar" || type === "pictorialBar"))) {
    return "axis";
  }

  return "item";
}

function buildTrendSeries(input: BuildGenericChartOptionInput, rows: GenericChartDataRow[]): SeriesOption[] {
  const columnCount = getValueColumnCount(rows);
  const baseSeries = buildDefaultSeries(input.series, columnCount);

  return baseSeries.map((seriesItem, seriesIndex) => {
    const nextSeries: Record<string, unknown> = {
      ...seriesItem,
      data: seriesItem.data ?? rows.map((row) => toNumberOrNull(row[seriesIndex + 1])),
      type: input.type,
    };

    if (input.type === "line") {
      Object.assign(nextSeries, {
        animation: false,
        animationDurationUpdate: 0,
        animationEasingUpdate: "linear",
        sampling: "lttb",
        showSymbol: false,
      });
    }

    return nextSeries as SeriesOption;
  });
}

function buildNativeSeries(input: BuildGenericChartOptionInput): SeriesOption[] {
  const baseSeries = buildDefaultSeries(input.series, 1);

  return baseSeries.map((seriesItem) => ({
    ...seriesItem,
    data: seriesItem.data ?? input.data,
    type: input.type,
  }) as SeriesOption);
}

export function buildGenericChartOption(input: BuildGenericChartOptionInput): EChartsOption {
  const rows = getTupleRows(input.data);
  const format = resolveGenericDataFormat(input.type, input.dataFormat ?? "auto", input.data);
  const baseSeries =
    format === "top"
      ? buildTopSeries(input, rows)
      : format === "trend"
        ? buildTrendSeries(input, rows)
        : buildNativeSeries(input);
  const series = applySeriesOptions(baseSeries, input.seriesOptions);
  const isAxisTopChart = format === "top" && (input.type === "bar" || input.type === "pictorialBar");
  const isTrendChart = format === "trend";
  const xAxisData = rows.map((row) => toDisplayValue(row[0]));
  const legend = isTrendChart ? buildLegendWithDefaultIcon(input.legend, "circle") : input.legend;

  return buildBaseOption({
    legend,
    options: {
      ...buildThemeOption(input.theme, input.themeOverrides),
      ...input.options,
    },
    series,
    tooltip: input.tooltip,
    tooltipTrigger: inferTooltipTrigger(input.type, format),
    xAxis:
      isAxisTopChart || isTrendChart
        ? normalizeAxisOption(input.xAxis, buildCategoryAxis(xAxisData.map(String)))
        : undefined,
    yAxis:
      isAxisTopChart || isTrendChart
        ? normalizeAxisOption(input.yAxis, buildValueAxis(input.labelContraction ?? true))
        : undefined,
  });
}
