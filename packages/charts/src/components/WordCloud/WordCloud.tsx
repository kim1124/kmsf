import { useEffect, useMemo, useState } from "react";
import type { EChartsOption, SeriesOption } from "echarts";

import { ChartFallback } from "../../common/ChartFallback";
import { KmsfChart } from "../../common/KmsfChart";
import { buildWordCloudTextStyle, getChartPalette } from "../../common/colors";
import { applySeriesOptions, buildBaseOption } from "../../common/options";
import { buildThemeOption } from "../../common/theme";
import type { KmsfBaseChartProps } from "../../common/types";
import { logChartIssuesOnce, validateChartConfig } from "../../common/validation";

export interface WordCloudProps extends KmsfBaseChartProps<unknown> {
  series?: SeriesOption[];
}

export function getWordCloudPalette(colors?: string[], palette?: string[]): string[] {
  return getChartPalette({ colors, themePalette: palette });
}

export function WordCloud(props: WordCloudProps) {
  const [isRegistered, setIsRegistered] = useState(false);
  const validation = useMemo(
    () =>
      validateChartConfig({
        data: props.data,
        label: "WordCloud",
        series: props.series,
        type: "wordCloud",
      }),
    [props.data, props.series],
  );

  useEffect(() => {
    logChartIssuesOnce(validation.issues);
  }, [validation.issues]);

  const option = useMemo<EChartsOption>(() => {
    const wordCloudPalette = getWordCloudPalette(props.colors, props.themeOverrides?.palette);
    const baseSeries = props.series?.length ? props.series : [{ name: "Series 1" } as SeriesOption];
    const series = applySeriesOptions(
      baseSeries.map((item) => ({
        ...item,
        data: item.data ?? (validation.valid ? props.data : []),
        textStyle: {
          ...((item as SeriesOption & { textStyle?: Record<string, unknown> }).textStyle ?? {}),
          ...buildWordCloudTextStyle(wordCloudPalette),
        },
        type: "wordCloud",
      }) as SeriesOption),
      props.seriesOptions,
    );

    return buildBaseOption({
      legend: props.legend ?? false,
      options: {
        ...buildThemeOption(props.theme, { ...props.themeOverrides, palette: wordCloudPalette }),
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
    props.series,
    props.seriesOptions,
    props.theme,
    props.themeOverrides,
    props.tooltip,
    validation.valid,
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
      >
        {props.loadingFallback}
      </div>
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
