import { useEffect, useMemo, useState } from "react";
import type { EChartsOption, SeriesOption } from "echarts";

import { KmsfChart } from "../../common/KmsfChart";
import { applySeriesOptions, buildBaseOption } from "../../common/options";
import { buildThemeOption, kmsfDarkPalette, kmsfLightPalette } from "../../common/theme";
import type { KmsfBaseChartProps } from "../../common/types";

export interface WordCloudProps extends KmsfBaseChartProps<unknown> {
  series: SeriesOption[];
}

export function getWordCloudPalette(theme: string | undefined, palette?: string[]): string[] {
  if (palette?.length) {
    return palette;
  }

  return theme === "dark" ? kmsfDarkPalette : kmsfLightPalette;
}

export function WordCloud(props: WordCloudProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const option = useMemo<EChartsOption>(() => {
    const wordCloudPalette = getWordCloudPalette(props.theme, props.themeOverrides?.palette);
    const series = applySeriesOptions(
      props.series.map((item) => ({
        ...item,
        data: item.data ?? props.data,
        textStyle: {
          color: () => wordCloudPalette[Math.floor(Math.random() * wordCloudPalette.length)],
        },
        type: "wordCloud",
      }) as SeriesOption),
      props.seriesOptions,
    );

    return buildBaseOption({
      legend: props.legend ?? false,
      options: {
        ...buildThemeOption(props.theme, props.themeOverrides),
        ...props.options,
      },
      series,
      tooltip: props.tooltip,
      tooltipTrigger: "item",
    });
  }, [
    props.data,
    props.legend,
    props.options,
    props.series,
    props.seriesOptions,
    props.theme,
    props.themeOverrides,
    props.tooltip,
  ]);

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
