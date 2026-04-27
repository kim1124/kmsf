import { useMemo } from "react";
import type { EChartsOption, SeriesOption } from "echarts";

import { KmsfChart } from "../../common/KmsfChart";
import { applySeriesOptions, buildBaseOption } from "../../common/options";
import { buildThemeOption } from "../../common/theme";
import type { KmsfBaseChartProps } from "../../common/types";

export interface SankeyChartProps extends KmsfBaseChartProps<unknown> {
  series: SeriesOption[];
}

export function SankeyChart(props: SankeyChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const series = applySeriesOptions(
      props.series.map((item) => ({
        ...item,
        data: item.data ?? props.data,
        type: "sankey",
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
  }, [props.data, props.legend, props.options, props.series, props.seriesOptions, props.theme, props.tooltip]);

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
