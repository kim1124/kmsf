import { useEffect, useMemo } from "react";
import type { EChartsOption, SeriesOption } from "echarts";

import { ChartFallback } from "../../common/ChartFallback";
import { KmsfChart } from "../../common/KmsfChart";
import { applySeriesPalette, getChartPalette } from "../../common/colors";
import { applySeriesOptions, buildBaseOption } from "../../common/options";
import { buildThemeOption } from "../../common/theme";
import type { KmsfBaseChartProps } from "../../common/types";
import { logChartIssuesOnce, validateChartConfig } from "../../common/validation";

export interface SunburstChartProps extends KmsfBaseChartProps<unknown> {
  radius?: string | [string, string];
}

export function SunburstChart(props: SunburstChartProps) {
  const validation = useMemo(
    () =>
      validateChartConfig({
        data: props.data,
        label: "SunburstChart",
        series: props.series,
        type: "sunburst",
      }),
    [props.data, props.series],
  );

  useEffect(() => {
    logChartIssuesOnce(validation.issues);
  }, [validation.issues]);

  const option = useMemo<EChartsOption>(() => {
    const palette = getChartPalette({
      colors: props.colors,
      themePalette: props.themeOverrides?.palette,
    });
    const baseSeries = props.series?.length
      ? props.series
      : [
          {
            name: "Series 1",
            data: validation.valid ? props.data : [],
          },
        ];
    const series = applySeriesOptions(
      applySeriesPalette(
        baseSeries.map((item) => ({
          data: item.data ?? (validation.valid ? props.data : []),
          emphasis: {
            focus: "ancestor",
          },
          label: {
            show: true,
          },
          labelLine: {
            show: true,
          },
          radius: props.radius,
          ...item,
          type: "sunburst",
        }) as SeriesOption),
        palette,
      ),
      props.seriesOptions,
    );

    return buildBaseOption({
      legend: props.legend ?? false,
      options: {
        ...buildThemeOption(props.theme, { ...props.themeOverrides, palette }),
        ...props.options,
      },
      series,
      tooltip: props.tooltip,
      tooltipTrigger: "item",
    });
  }, [
    props.data,
    props.colors,
    props.legend,
    props.options,
    props.radius,
    props.series,
    props.seriesOptions,
    props.theme,
    props.themeOverrides,
    props.tooltip,
    validation.valid,
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
