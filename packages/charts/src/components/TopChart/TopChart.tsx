import { useMemo } from "react";
import type { EChartsOption } from "echarts";

import { KmsfChart } from "../../common/KmsfChart";
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

export interface TopChartProps extends KmsfBaseChartProps<TopChartRow[]> {
  mode?: TopChartMode;
}

export function TopChart(props: TopChartProps) {
  const normalized = useMemo(() => normalizeTopRows(props.data), [props.data]);

  const option = useMemo<EChartsOption>(() => {
    const mode = props.mode ?? "pie";
    const baseSeries = buildTopSeries({
      categories: normalized.categories,
      mode,
      series: props.series,
      valuesBySeries: normalized.seriesValues,
    });
    const series = applySeriesOptions(baseSeries, props.seriesOptions);
    const isCartesian = mode === "bar" || mode === "column";
    const rotateLabels = mode === "column" && shouldRotateCategoryLabels(normalized.categories);

    return buildBaseOption({
      legend: props.legend,
      options: {
        ...buildThemeOption(props.theme, props.themeOverrides),
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

  return (
    <KmsfChart
      className={props.className}
      height={props.height}
      option={option}
      style={props.style}
      theme={props.theme}
    />
  );
}
