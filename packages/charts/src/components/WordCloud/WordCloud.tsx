import { useEffect, useMemo, useState } from "react";
import type { EChartsOption, SeriesOption } from "echarts";

import { KmsfChart } from "../../common/KmsfChart";
import { applySeriesOptions, buildBaseOption } from "../../common/options";
import { buildThemeOption } from "../../common/theme";
import type { KmsfBaseChartProps } from "../../common/types";

export interface WordCloudProps extends KmsfBaseChartProps<unknown> {
  series: SeriesOption[];
}

const wordCloudColors = ["#14b8a6", "#84cc16", "#0ea5e9", "#f97316", "#8b5cf6", "#ef4444", "#06b6d4"];

export function WordCloud(props: WordCloudProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const option = useMemo<EChartsOption>(() => {
    const series = applySeriesOptions(
      props.series.map((item) => ({
        ...item,
        data: item.data ?? props.data,
        textStyle: {
          color: () => wordCloudColors[Math.floor(Math.random() * wordCloudColors.length)],
        },
        type: "wordCloud",
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

  useEffect(() => {
    let mounted = true;

    void import("echarts-wordcloud").then(() => {
      if (mounted) {
        setIsRegistered(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!isRegistered) {
    return (
      <div
        className={props.className}
        style={{
          height: props.height ?? 320,
          minHeight: 160,
          width: "100%",
          ...props.style,
        }}
      />
    );
  }

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
