import type {
  DataZoomComponentOption,
  EChartsOption,
  LegendComponentOption,
  SeriesOption,
  TooltipComponentOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from "echarts";

import { ellipsisLabel, formatNumberWithComma } from "./formatters";
import type { KmsfAxisOption, KmsfLegendOption, KmsfTooltipOption, SeriesOverride } from "./types";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function mergeChartOptions<T extends PlainObject>(base: T, override?: PlainObject): T {
  if (!override) {
    return base;
  }

  const result: PlainObject = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = result[key];

    if (isPlainObject(current) && isPlainObject(value)) {
      result[key] = mergeChartOptions(current, value);
      continue;
    }

    result[key] = value;
  }

  return result as T;
}

export function buildLegendOption(legend: KmsfLegendOption | undefined): LegendComponentOption {
  if (legend === false) {
    return { show: false };
  }

  if (legend === true || legend === undefined) {
    return { show: true };
  }

  return { show: true, ...legend };
}

export function buildTooltipOption(tooltip: KmsfTooltipOption | undefined): TooltipComponentOption {
  const base: TooltipComponentOption = {
    appendToBody: true,
    confine: false,
    show: true,
    trigger: "axis",
  };

  if (tooltip === false) {
    return { show: false };
  }

  if (tooltip === true || tooltip === undefined) {
    return base;
  }

  return mergeChartOptions(base as PlainObject, tooltip as PlainObject) as TooltipComponentOption;
}

export function normalizeAxisOption<TAxis>(
  option: KmsfAxisOption<TAxis> | undefined,
  fallback: TAxis,
): TAxis | TAxis[] {
  if (!option) {
    return fallback;
  }

  if (Array.isArray(option)) {
    return option.map((axis) => mergeChartOptions(fallback as PlainObject, axis as PlainObject) as TAxis);
  }

  return mergeChartOptions(fallback as PlainObject, option as PlainObject) as TAxis;
}

export function applySeriesOptions(series: SeriesOption[], seriesOptions?: SeriesOverride): SeriesOption[] {
  if (!seriesOptions) {
    return series;
  }

  if (Array.isArray(seriesOptions)) {
    return series.map((item, index) =>
      mergeChartOptions(item as PlainObject, seriesOptions[index] as PlainObject | undefined) as SeriesOption,
    );
  }

  return series.map((item) => mergeChartOptions(item as PlainObject, seriesOptions as PlainObject) as SeriesOption);
}

export function buildValueAxis(labelContraction = true): YAXisComponentOption {
  return {
    axisLabel: {
      formatter: labelContraction ? (value: unknown) => formatNumberWithComma(value) : undefined,
    },
    type: "value",
  };
}

export function shouldRotateCategoryLabels(categories: string[], containerWidth = 420): boolean {
  if (categories.length === 0) {
    return false;
  }

  const slotWidth = containerWidth / categories.length;
  const maxEstimatedLabelWidth = Math.max(...categories.map((category) => category.length * 8));

  return maxEstimatedLabelWidth > slotWidth;
}

export function buildCategoryAxis(categories: string[], rotate = 0): XAXisComponentOption {
  return {
    axisLabel: {
      formatter: (value: unknown) => ellipsisLabel(value),
      interval: "auto",
      rotate,
    },
    data: categories,
    type: "category",
  };
}

export function buildTrendDataZoom(showSlider = false): DataZoomComponentOption[] {
  const dataZoom: DataZoomComponentOption[] = [{ type: "inside" }];

  if (showSlider) {
    dataZoom.push({ bottom: 0, type: "slider" });
  }

  return dataZoom;
}

export function buildBaseOption(input: {
  legend?: KmsfLegendOption;
  tooltip?: KmsfTooltipOption;
  options?: EChartsOption;
  series: SeriesOption[];
  xAxis?: XAXisComponentOption | XAXisComponentOption[];
  yAxis?: YAXisComponentOption | YAXisComponentOption[];
}): EChartsOption {
  const base: EChartsOption = {
    animation: true,
    grid: {
      bottom: 28,
      containLabel: true,
      left: 12,
      right: 12,
      top: 36,
    },
    legend: buildLegendOption(input.legend),
    tooltip: buildTooltipOption(input.tooltip),
    series: input.series,
  };

  if (input.xAxis) {
    base.xAxis = input.xAxis;
  }

  if (input.yAxis) {
    base.yAxis = input.yAxis;
  }

  return mergeChartOptions(base as PlainObject, input.options as PlainObject | undefined) as EChartsOption;
}
