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
  hasVisibleChartTitle,
  mergeChartOptions,
  normalizeAxisOption,
} from "./options";
import {
  applyItemPalette,
  applySeriesPalette,
  buildWordCloudTextStyle,
  getChartPalette,
} from "./colors";
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
  colors?: string[];
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
const itemColorTypes = new Set<KmsfChartType>(["funnel", "pie", "treemap"]);
const hiddenLegendByDefaultTypes = new Set<KmsfChartType>([
  "bar",
  "funnel",
  "gauge",
  "heatmap",
  "pictorialBar",
  "sankey",
  "sunburst",
  "treemap",
  "wordCloud",
]);
const dataLegendTypes = new Set<KmsfChartType>(["funnel", "pie", "sunburst", "treemap", "wordCloud"]);

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

function resolveLegendDefault(type: KmsfChartType, legend: KmsfLegendOption | undefined): KmsfLegendOption | undefined {
  if (legend !== undefined) {
    return legend;
  }

  return hiddenLegendByDefaultTypes.has(type) ? false : undefined;
}

function buildDataLegendDefaults(type: KmsfChartType): LegendComponentOption | undefined {
  if (!dataLegendTypes.has(type)) {
    return undefined;
  }

  const base: LegendComponentOption = {
    pageButtonItemGap: 6,
    pageButtonPosition: "end",
    pageIconColor: "#64748b",
    pageIconInactiveColor: "#cbd5e1",
    textStyle: {
      ellipsis: "...",
      overflow: "truncate",
      width: 112,
    },
    type: "scroll",
  };

  if (type !== "pie") {
    return base;
  }

  return {
    ...base,
    bottom: 12,
    orient: "vertical",
    right: 8,
    top: 36,
  };
}

function isLegendVisible(legend: KmsfLegendOption | undefined): boolean {
  if (legend === false) {
    return false;
  }

  if (legend && typeof legend === "object" && "show" in legend && legend.show === false) {
    return false;
  }

  return true;
}

function applyPieLegendLayout(type: KmsfChartType, series: SeriesOption[], legendVisible: boolean): SeriesOption[] {
  if (type !== "pie" || !legendVisible) {
    return series;
  }

  return series.map((item) => {
    const source = item as SeriesOption & { center?: unknown; radius?: unknown };

    return {
      ...item,
      center: source.center ?? ["34%", "52%"],
      radius: source.radius ?? ["32%", "66%"],
    } as SeriesOption;
  });
}

function buildRadarLegendDefault(
  type: KmsfChartType,
  legend: KmsfLegendOption | undefined,
  titleVisible: boolean,
): KmsfLegendOption | undefined {
  if (type !== "radar" || !isLegendVisible(legend)) {
    return legend;
  }

  const top = titleVisible ? 56 : 8;

  if (legend === undefined || legend === true) {
    return { top };
  }

  if (legend && typeof legend === "object") {
    return { top, ...legend };
  }

  return legend;
}

function getProtectedTop(input: { legendVisible: boolean; titleVisible: boolean }) {
  if (input.titleVisible && input.legendVisible) {
    return 96;
  }

  if (input.titleVisible) {
    return 80;
  }

  if (input.legendVisible) {
    return 64;
  }

  return 28;
}

function buildNonGridLayoutDefaults(
  type: KmsfChartType,
  input: { legendVisible: boolean; titleVisible: boolean },
): EChartsOption {
  if (!input.titleVisible && !input.legendVisible && type !== "radar") {
    return {};
  }

  const top = getProtectedTop(input);

  if (type === "radar") {
    const hasProtectedHeader = input.titleVisible || input.legendVisible;

    return {
      radar: {
        center: ["50%", hasProtectedHeader ? "62%" : "58%"],
        radius: hasProtectedHeader ? "46%" : "50%",
      },
    };
  }

  if (type === "parallel") {
    return {
      parallel: {
        bottom: 28,
        left: 56,
        right: 28,
        top,
      },
    };
  }

  if (type === "themeRiver") {
    return {
      singleAxis: {
        bottom: 38,
        left: 48,
        right: 24,
        top,
        type: "time",
      },
    };
  }

  return {};
}

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeRadarIndicatorSafety(radar: unknown): unknown {
  if (Array.isArray(radar)) {
    return radar.map(normalizeRadarIndicatorSafety);
  }

  if (!isPlainObject(radar)) {
    return radar;
  }

  const splitNumber = toFiniteNumber(radar.splitNumber) ?? 5;
  const indicator = Array.isArray(radar.indicator)
    ? radar.indicator.map((item) => {
        if (!isPlainObject(item)) {
          return item;
        }

        const max = toFiniteNumber(item.max);
        const min = toFiniteNumber(item.min) ?? (max !== undefined && max > 0 ? 0 : undefined);
        const interval = toFiniteNumber(item.interval) ?? (
          max !== undefined && min !== undefined && max > min && splitNumber > 0
            ? (max - min) / splitNumber
            : undefined
        );

        return {
          ...item,
          alignTicks: item.alignTicks ?? false,
          ...(min !== undefined && item.min === undefined ? { min } : {}),
          ...(interval !== undefined && interval > 0 && item.interval === undefined ? { interval } : {}),
        };
      })
    : radar.indicator;

  return {
    ...radar,
    alignTicks: radar.alignTicks ?? false,
    ...(indicator ? { indicator } : {}),
  };
}

function applyRadarIndicatorSafety(type: KmsfChartType, options: EChartsOption): EChartsOption {
  if (type !== "radar" || options.radar === undefined) {
    return options;
  }

  return {
    ...options,
    radar: normalizeRadarIndicatorSafety(options.radar) as EChartsOption["radar"],
  };
}

function applyNonGridSeriesLayoutDefaults(
  type: KmsfChartType,
  series: SeriesOption[],
  input: { legendVisible: boolean; titleVisible: boolean },
): SeriesOption[] {
  if (!input.titleVisible && !input.legendVisible) {
    return series;
  }

  const top = getProtectedTop(input);

  return series.map((item) => {
    const source = item as SeriesOption & Record<string, unknown>;

    if (type === "gauge") {
      return {
        ...item,
        center: source.center ?? ["50%", input.titleVisible ? "60%" : "58%"],
        radius: source.radius ?? (input.titleVisible ? "58%" : "64%"),
      } as SeriesOption;
    }

    if (type === "funnel" || type === "treemap" || type === "wordCloud") {
      return {
        ...item,
        height: source.height ?? "72%",
        top: source.top ?? top,
      } as SeriesOption;
    }

    if (type === "sunburst") {
      return {
        ...item,
        center: source.center ?? ["50%", input.titleVisible ? "58%" : "55%"],
        radius: source.radius ?? ["10%", input.titleVisible ? "70%" : "78%"],
      } as SeriesOption;
    }

    if (type === "tree" || type === "graph" || type === "sankey") {
      return {
        ...item,
        bottom: source.bottom ?? 12,
        top: source.top ?? top,
      } as SeriesOption;
    }

    if (type === "pie") {
      return {
        ...item,
        center: source.center ?? ["34%", input.titleVisible ? "56%" : "52%"],
        radius: source.radius ?? ["28%", input.titleVisible ? "62%" : "66%"],
      } as SeriesOption;
    }

    return item;
  });
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
        smooth: true,
      });
    }

    return nextSeries as SeriesOption;
  });
}

function applyTopLabelDefaults(type: KmsfChartType, series: SeriesOption[]): SeriesOption[] {
  if (type !== "pie" && type !== "funnel" && type !== "sunburst") {
    return series;
  }

  return series.map((item) => {
    const source = item as SeriesOption & { label?: unknown; labelLine?: unknown };

    return {
      ...item,
      label: source.label ?? { show: false },
      labelLine: source.labelLine ?? { show: false },
    } as SeriesOption;
  });
}

function buildTopSingleSeriesTooltipFormatter() {
  return (params: unknown) => {
    const item = Array.isArray(params) ? params[0] : params;
    const dataIndex = Number((item as { dataIndex?: unknown }).dataIndex ?? 0) + 1;
    const name = String((item as { name?: unknown }).name ?? "");
    const value = String((item as { value?: unknown }).value ?? "");

    return `Item ${dataIndex}: ${name}<br/>${value}`;
  };
}

function buildTooltipDefaults(input: {
  format: Exclude<GenericChartDataFormat, "auto">;
  series: SeriesOption[];
}): TooltipComponentOption | undefined {
  if (input.format !== "top" || input.series.length !== 1) {
    return undefined;
  }

  return { formatter: buildTopSingleSeriesTooltipFormatter() };
}

function buildNativeSeries(input: BuildGenericChartOptionInput): SeriesOption[] {
  const baseSeries = buildDefaultSeries(input.series, 1);

  return baseSeries.map((seriesItem) => {
    const nextSeries: Record<string, unknown> = {
      ...seriesItem,
      data: seriesItem.data ?? input.data,
      type: input.type,
    };

    if (input.type === "lines" && nextSeries.zlevel === undefined) {
      nextSeries.zlevel = 0;
    }

    return nextSeries as SeriesOption;
  });
}

function applyGenericPalette(
  type: KmsfChartType,
  series: SeriesOption[],
  palette: string[],
): SeriesOption[] {
  if (type === "wordCloud") {
    return series.map((item) => ({
      ...item,
      textStyle: {
        ...((item as SeriesOption & { textStyle?: Record<string, unknown> }).textStyle ?? {}),
        ...buildWordCloudTextStyle(palette),
      },
    }) as SeriesOption);
  }

  if (itemColorTypes.has(type)) {
    return series.map((item) => {
      const source = item as SeriesOption & { data?: unknown };

      return {
        ...item,
        data: Array.isArray(source.data) ? applyItemPalette(source.data, palette) : source.data,
      } as SeriesOption;
    });
  }

  return applySeriesPalette(series, palette);
}

export function buildGenericChartOption(input: BuildGenericChartOptionInput): EChartsOption {
  const rows = getTupleRows(input.data);
  const format = resolveGenericDataFormat(input.type, input.dataFormat ?? "auto", input.data);
  const palette = getChartPalette({
    colors: input.colors,
    themePalette: input.themeOverrides?.palette,
  });
  const baseSeries =
    format === "top"
      ? buildTopSeries(input, rows)
      : format === "trend"
        ? buildTrendSeries(input, rows)
        : buildNativeSeries(input);
  const isAxisTopChart = format === "top" && (input.type === "bar" || input.type === "pictorialBar");
  const isTrendChart = format === "trend";
  const xAxisData = rows.map((row) => toDisplayValue(row[0]));
  const baseLegend = resolveLegendDefault(input.type, input.legend);
  const legendWithDefaultIcon = buildLegendWithDefaultIcon(baseLegend, "circle");
  const titleVisible = hasVisibleChartTitle(input.options);
  const legend = buildRadarLegendDefault(input.type, legendWithDefaultIcon, titleVisible);
  const coloredSeries = applyGenericPalette(input.type, baseSeries, palette);
  const legendVisible = isLegendVisible(legend);
  const legendAdjustedSeries = applyPieLegendLayout(input.type, coloredSeries, legendVisible);
  const labelAdjustedSeries = applyTopLabelDefaults(input.type, legendAdjustedSeries);
  const layoutAdjustedSeries = applyNonGridSeriesLayoutDefaults(input.type, labelAdjustedSeries, {
    legendVisible,
    titleVisible,
  });
  const series = applySeriesOptions(layoutAdjustedSeries, input.seriesOptions);
  const defaultOptions = mergeChartOptions(
    buildThemeOption(input.theme, { ...input.themeOverrides, palette }) as Record<string, unknown>,
    buildNonGridLayoutDefaults(input.type, { legendVisible, titleVisible }) as Record<string, unknown>,
  ) as EChartsOption;
  const options = applyRadarIndicatorSafety(input.type, mergeChartOptions(
    defaultOptions as Record<string, unknown>,
    input.options as Record<string, unknown> | undefined,
  ) as EChartsOption);

  return buildBaseOption({
    legend,
    legendDefaults: buildDataLegendDefaults(input.type),
    options,
    series,
    tooltip: input.tooltip,
    tooltipDefaults: buildTooltipDefaults({ format, series }),
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
