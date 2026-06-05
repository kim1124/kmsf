import { useEffect, useMemo } from "react";
import type { EChartsOption, SeriesOption } from "echarts";

import { ChartFallback } from "../../common/ChartFallback";
import { KmsfChart } from "../../common/KmsfChart";
import { applySeriesPalette, getChartPalette } from "../../common/colors";
import { applySeriesOptions, buildBaseOption } from "../../common/options";
import { buildThemeOption } from "../../common/theme";
import type { KmsfBaseChartProps } from "../../common/types";
import { logChartIssuesOnce, validateChartConfig } from "../../common/validation";

export interface SankeyLink {
  source: string;
  target: string;
  value?: number;
}

export interface SankeyChartProps extends KmsfBaseChartProps<unknown> {
  links?: SankeyLink[];
}

export function SankeyChart(props: SankeyChartProps) {
  const series = useMemo<SeriesOption[]>(() => {
    const palette = getChartPalette({
      colors: props.colors,
      themePalette: props.themeOverrides?.palette,
    });
    const baseSeries = props.series?.length ? props.series : [{ name: "Series 1" } as SeriesOption];

    return applySeriesOptions(
      applySeriesPalette(
        baseSeries.map((item) => {
          const source = item as SeriesOption & { links?: SankeyLink[] };

          return {
            ...item,
            data: item.data ?? props.data,
            links: source.links ?? props.links,
            type: "sankey",
          } as SeriesOption;
        }),
        palette,
      ),
      props.seriesOptions,
    );
  }, [props.colors, props.data, props.links, props.series, props.seriesOptions, props.themeOverrides]);

  const validation = useMemo(
    () =>
      validateChartConfig({
        data: props.data,
        label: "SankeyChart",
        series,
        seriesOptions: props.seriesOptions,
        type: "sankey",
      }),
    [props.data, props.seriesOptions, series],
  );

  useEffect(() => {
    logChartIssuesOnce(validation.issues);
  }, [validation.issues]);

  const option = useMemo<EChartsOption>(() => {
    const palette = getChartPalette({
      colors: props.colors,
      themePalette: props.themeOverrides?.palette,
    });

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
    props.colors,
    props.legend,
    props.options,
    props.theme,
    props.themeOverrides,
    props.tooltip,
    series,
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
