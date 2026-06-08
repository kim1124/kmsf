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

export function buildLegendOption(
  legend: KmsfLegendOption | undefined,
  defaults?: LegendComponentOption,
): LegendComponentOption {
  if (legend === false) {
    return { show: false };
  }

  if (legend === true || legend === undefined) {
    return { icon: "circle", show: true, ...defaults };
  }

  return mergeChartOptions({ icon: "circle", show: true, ...defaults } as PlainObject, legend as PlainObject) as LegendComponentOption;
}

export function buildTooltipOption(
  tooltip: KmsfTooltipOption | undefined,
  trigger: TooltipComponentOption["trigger"] = "axis",
  defaults?: TooltipComponentOption,
): TooltipComponentOption {
  const base: TooltipComponentOption = {
    appendToBody: true,
    confine: false,
    show: true,
    trigger,
    ...defaults,
  };

  if (tooltip === false) {
    return { show: false };
  }

  if (tooltip === true || tooltip === undefined) {
    return base;
  }

  return mergeChartOptions(base as PlainObject, tooltip as PlainObject) as TooltipComponentOption;
}

export function hasVisibleChartTitle(options?: EChartsOption): boolean {
  const title = Array.isArray(options?.title) ? options.title[0] : options?.title;

  if (!isPlainObject(title)) {
    return false;
  }

  return Boolean(title.text || title.subtext);
}

export function buildTitleDefaults(): EChartsOption {
  return { title: { subtext: "", text: "" } };
}

export function buildGridLayoutDefaults(input: { legendVisible: boolean; titleVisible: boolean }): EChartsOption {
  if (!input.titleVisible && !input.legendVisible) {
    return {};
  }

  return {
    grid: {
      top: input.titleVisible && input.legendVisible ? 104 : input.titleVisible ? 80 : 56,
    },
  };
}

function hasExplicitLegendVerticalPlacement(legend?: KmsfLegendOption): boolean {
  return Boolean(
    legend &&
      typeof legend === "object" &&
      ("top" in legend || "bottom" in legend),
  );
}

function applyTitleLegendSpacing(
  legend: LegendComponentOption,
  inputLegend: KmsfLegendOption | undefined,
  titleVisible: boolean,
): LegendComponentOption {
  if (!titleVisible || legend.show === false || hasExplicitLegendVerticalPlacement(inputLegend) || legend.bottom !== undefined) {
    return legend;
  }

  const top = typeof legend.top === "number" ? Math.max(legend.top, 56) : 56;

  return { ...legend, top };
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
  legendDefaults?: LegendComponentOption;
  tooltip?: KmsfTooltipOption;
  tooltipDefaults?: TooltipComponentOption;
  tooltipTrigger?: TooltipComponentOption["trigger"];
  options?: EChartsOption;
  series: SeriesOption[];
  xAxis?: XAXisComponentOption | XAXisComponentOption[];
  yAxis?: YAXisComponentOption | YAXisComponentOption[];
}): EChartsOption {
  const titleVisible = hasVisibleChartTitle(input.options);
  const legend = applyTitleLegendSpacing(
    buildLegendOption(input.legend, input.legendDefaults),
    input.legend,
    titleVisible,
  );
  const layoutDefaults = buildGridLayoutDefaults({
    legendVisible: legend.show !== false,
    titleVisible,
  });
  const base: EChartsOption = {
    animation: true,
    ...buildTitleDefaults(),
    grid: {
      bottom: 28,
      containLabel: true,
      left: 12,
      right: 12,
      top: 36,
    },
    legend,
    tooltip: buildTooltipOption(input.tooltip, input.tooltipTrigger, input.tooltipDefaults),
    series: input.series,
  };

  if (input.xAxis) {
    base.xAxis = input.xAxis;
  }

  if (input.yAxis) {
    base.yAxis = input.yAxis;
  }

  const baseWithLayout = mergeChartOptions(base as PlainObject, layoutDefaults as PlainObject);

  return mergeChartOptions(baseWithLayout, input.options as PlainObject | undefined) as EChartsOption;
}
