import { useMemo } from "react";
import type { EChartsOption, SeriesOption } from "echarts";

import { KmsfChart } from "../../common/KmsfChart";
import { applySeriesOptions, buildBaseOption } from "../../common/options";
import { buildThemeOption } from "../../common/theme";
import type { KmsfBaseChartProps } from "../../common/types";

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
  const option = useMemo<EChartsOption>(() => {
    const normalizedData = normalizeGaugeData(props.data);
    const baseSeries = props.series?.length
      ? props.series
      : [
          {
            name: "Series 1",
            data: normalizedData,
          },
        ];
    const series = applySeriesOptions(
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
    props.max,
    props.min,
    props.options,
    props.series,
    props.seriesOptions,
    props.theme,
    props.themeOverrides,
    props.tooltip,
    props.unit,
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
