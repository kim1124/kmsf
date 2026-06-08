import { useEffect, useMemo } from "react";
import type { EChartsOption, LegendComponentOption, SeriesOption } from "echarts";

import { ChartFallback } from "../../common/ChartFallback";
import { KmsfChart } from "../../common/KmsfChart";
import { applyItemPalette, applySeriesPalette, getChartPalette } from "../../common/colors";
import { buildTopSeries, normalizeTopRows } from "../../common/data-normalizers";
import {
  applySeriesOptions,
  buildBaseOption,
  buildCategoryAxis,
  buildValueAxis,
  normalizeAxisOption,
  shouldRotateCategoryLabels,
} from "../../common/options";
import { buildThemeOption } from "../../common/theme";
import type { KmsfBaseChartProps, TopChartMode, TopChartRow } from "../../common/types";
import { logChartIssuesOnce, validateChartConfig } from "../../common/validation";

export interface TopChartProps extends KmsfBaseChartProps<TopChartRow[]> {
  mode?: TopChartMode;
}

function resolveTopChartLegend(mode: TopChartMode, legend: TopChartProps["legend"]) {
  if (legend !== undefined) {
    return legend;
  }

  return mode === "bar" || mode === "column" || mode === "treemap" ? false : undefined;
}

function buildTopChartLegendDefaults(mode: TopChartMode): LegendComponentOption | undefined {
  if (mode !== "pie" && mode !== "treemap") {
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

  if (mode !== "pie") {
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

function isLegendVisible(legend: TopChartProps["legend"]) {
  if (legend === false) {
    return false;
  }

  if (legend && typeof legend === "object" && "show" in legend && legend.show === false) {
    return false;
  }

  return true;
}

function applyTopChartPieLegendLayout(mode: TopChartMode, series: SeriesOption[], legendVisible: boolean) {
  if (mode !== "pie" || !legendVisible) {
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

function buildTopChartTooltipFormatter() {
  return (params: unknown) => {
    const item = Array.isArray(params) ? params[0] : params;
    const dataIndex = Number((item as { dataIndex?: unknown }).dataIndex ?? 0) + 1;
    const name = String((item as { name?: unknown }).name ?? "");
    const value = String((item as { value?: unknown }).value ?? "");

    return `Item ${dataIndex}: ${name}<br/>${value}`;
  };
}

export function TopChart(props: TopChartProps) {
  const validation = useMemo(
    () =>
      validateChartConfig({
        data: props.data,
        label: "TopChart",
        series: props.series,
        type: "pie",
      }),
    [props.data, props.series],
  );

  useEffect(() => {
    logChartIssuesOnce(validation.issues);
  }, [validation.issues]);

  const chartData = validation.valid ? props.data : [];
  const normalized = useMemo(() => normalizeTopRows(chartData), [chartData]);

  const option = useMemo<EChartsOption>(() => {
    const mode = props.mode ?? "pie";
    const palette = getChartPalette({
      colors: props.colors,
      themePalette: props.themeOverrides?.palette,
    });
    const baseSeries = buildTopSeries({
      categories: normalized.categories,
      mode,
      series: props.series,
      valuesBySeries: normalized.seriesValues,
    });
    const coloredSeries: SeriesOption[] =
      mode === "pie" || mode === "treemap"
        ? baseSeries.map((item) => ({
            ...item,
            data: Array.isArray(item.data) ? applyItemPalette(item.data, palette) : item.data,
          }) as SeriesOption)
        : applySeriesPalette(baseSeries, palette);
    const resolvedLegend = resolveTopChartLegend(mode, props.legend);
    const legendAdjustedSeries = applyTopChartPieLegendLayout(mode, coloredSeries, isLegendVisible(resolvedLegend));
    const series = applySeriesOptions(legendAdjustedSeries, props.seriesOptions);
    const isCartesian = mode === "bar" || mode === "column";
    const rotateLabels = mode === "column" && shouldRotateCategoryLabels(normalized.categories);

    return buildBaseOption({
      legend: resolvedLegend,
      legendDefaults: buildTopChartLegendDefaults(mode),
      options: {
        ...buildThemeOption(props.theme, { ...props.themeOverrides, palette }),
        ...props.options,
      },
      series,
      tooltip: props.tooltip,
      tooltipDefaults: !isCartesian && series.length === 1 ? { formatter: buildTopChartTooltipFormatter() } : undefined,
      tooltipTrigger: isCartesian ? "axis" : "item",
      xAxis: isCartesian
        ? normalizeAxisOption(props.xAxis, buildCategoryAxis(normalized.categories, rotateLabels ? 45 : 0))
        : undefined,
      yAxis: isCartesian
        ? normalizeAxisOption(props.yAxis, buildValueAxis(props.labelContraction ?? true))
        : undefined,
    });
  }, [
    normalized,
    props.colors,
    props.legend,
    props.labelContraction,
    props.mode,
    props.options,
    props.series,
    props.seriesOptions,
    props.theme,
    props.themeOverrides,
    props.tooltip,
    props.xAxis,
    props.yAxis,
  ]);

  if (!validation.valid) {
    return (
      <ChartFallback
        className={props.className}
        height={props.height}
        message={validation.issues[0]?.message ?? "Invalid chart configuration."}
        style={props.style}
      />
    );
  }

  return (
    <KmsfChart
      className={props.className}
      height={props.height}
      loadingFallback={props.loadingFallback}
      option={option}
      style={props.style}
      theme={props.theme}
    />
  );
}
