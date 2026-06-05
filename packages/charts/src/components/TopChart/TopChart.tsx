import { useEffect, useMemo } from "react";
import type { EChartsOption, SeriesOption } from "echarts";

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
    const series = applySeriesOptions(coloredSeries, props.seriesOptions);
    const isCartesian = mode === "bar" || mode === "column";
    const rotateLabels = mode === "column" && shouldRotateCategoryLabels(normalized.categories);

    return buildBaseOption({
      legend: props.legend,
      options: {
        ...buildThemeOption(props.theme, { ...props.themeOverrides, palette }),
        ...props.options,
      },
      series,
      tooltip: props.tooltip,
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
