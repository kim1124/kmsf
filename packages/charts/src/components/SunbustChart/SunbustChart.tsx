import { useMemo } from "react";
import type { EChartsOption, SeriesOption } from "echarts";

import { KmsfChart } from "../../common/KmsfChart";
import { applySeriesOptions, buildBaseOption } from "../../common/options";
import { buildThemeOption } from "../../common/theme";
import type { KmsfBaseChartProps } from "../../common/types";

export interface SunbustChartProps extends KmsfBaseChartProps<unknown> {
  radius?: string | [string, string];
}

export function SunbustChart(props: SunbustChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const baseSeries = props.series?.length
      ? props.series
      : [
          {
            name: "Series 1",
            data: props.data,
          },
        ];
    const series = applySeriesOptions(
      baseSeries.map((item) => ({
        data: item.data ?? props.data,
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
      props.seriesOptions,
    );

    return buildBaseOption({
      legend: props.legend ?? false,
      options: {
        ...buildThemeOption(props.theme),
        ...props.options,
      },
      series,
      tooltip: props.tooltip,
    });
  }, [props.data, props.legend, props.options, props.radius, props.series, props.seriesOptions, props.theme, props.tooltip]);

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
