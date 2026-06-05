import { useEffect, useMemo } from "react";
import type { EChartsOption, SeriesOption } from "echarts";

import { ChartFallback } from "../../common/ChartFallback";
import { KmsfChart } from "../../common/KmsfChart";
import { applySeriesPalette, getChartPalette } from "../../common/colors";
import { applySeriesOptions, buildBaseOption } from "../../common/options";
import { buildThemeOption } from "../../common/theme";
import type { KmsfBaseChartProps } from "../../common/types";
import { logChartIssuesOnce, validateChartConfig } from "../../common/validation";

export interface GaugeChartProps extends KmsfBaseChartProps<unknown> {
  max?: number;
  min?: number;
  unit?: string;
}

function normalizeGaugeData(data: unknown) {
  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data === "number") {
    return [{ value: data }];
  }

  if (data && typeof data === "object") {
    return [data];
  }

  return [{ value: 0 }];
}

function formatGaugeValue(value: unknown, unit?: string) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  return `${safeValue}${unit ?? ""}`;
}

export function GaugeChart(props: GaugeChartProps) {
  const validation = useMemo(
    () =>
      validateChartConfig({
        data: props.data,
        label: "GaugeChart",
        series: props.series,
        type: "gauge",
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
    const normalizedData = normalizeGaugeData(validation.valid ? props.data : 0);
    const baseSeries = props.series?.length
      ? props.series
      : [
          {
            name: "Series 1",
            data: normalizedData,
          },
        ];
    const series = applySeriesOptions(
      applySeriesPalette(
        baseSeries.map((item) => ({
          axisLabel: {
            formatter: (value: unknown) => formatGaugeValue(value, props.unit),
          },
          detail: {
            formatter: (value: unknown) => formatGaugeValue(value, props.unit),
          },
          max: props.max ?? 100,
          min: props.min ?? 0,
          progress: { show: true },
          data: item.data ?? normalizedData,
          ...item,
          type: "gauge",
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
    props.max,
    props.min,
    props.options,
    props.series,
    props.seriesOptions,
    props.theme,
    props.themeOverrides,
    props.tooltip,
    props.unit,
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
