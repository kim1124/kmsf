import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import type { ECharts, EChartsOption, SeriesOption } from "echarts";

import { KmsfChart } from "../../common/KmsfChart";
import { buildTrendSeries, normalizeTrendRows } from "../../common/data-normalizers";
import {
  applySeriesOptions,
  buildBaseOption,
  buildCategoryAxis,
  buildTrendDataZoom,
  buildValueAxis,
  normalizeAxisOption,
} from "../../common/options";
import { buildThemeOption } from "../../common/theme";
import type { KmsfBaseChartProps, TrendChartMode, TrendChartRow } from "../../common/types";

export interface TrendChartHandle {
  getChart: () => ECharts | null;
  updateDataAt: (rowIndex: number, values: Array<number | null>) => void;
}

export interface TrendChartProps extends KmsfBaseChartProps<TrendChartRow[]> {
  mode?: TrendChartMode;
  onAfterZoom?: (payload: unknown) => void;
  onBeforeZoom?: (payload: unknown) => void;
  series: SeriesOption[];
}

function buildTrendLegendOption(legend: TrendChartProps["legend"]): TrendChartProps["legend"] {
  if (legend === false) {
    return false;
  }

  if (legend === undefined || legend === true) {
    return { icon: "circle" };
  }

  return { icon: "circle", ...legend };
}

export const TrendChart = forwardRef<TrendChartHandle, TrendChartProps>(function TrendChart(props, ref) {
  const chartRef = useRef<ECharts | null>(null);
  const normalized = useMemo(() => normalizeTrendRows(props.data), [props.data]);

  const option = useMemo<EChartsOption>(() => {
    const baseSeries = buildTrendSeries({
      mode: props.mode ?? "line",
      series: props.series,
      valuesBySeries: normalized.seriesValues,
    });
    const series = applySeriesOptions(baseSeries, props.seriesOptions);
    const xAxis = normalizeAxisOption(
      props.xAxis,
      buildCategoryAxis(normalized.xAxisData),
    );
    const yAxis = normalizeAxisOption(props.yAxis, buildValueAxis(props.labelContraction ?? true));

    return buildBaseOption({
      legend: buildTrendLegendOption(props.legend),
      options: {
        ...buildThemeOption(props.theme, props.themeOverrides),
        animation: false,
        animationDurationUpdate: 0,
        dataZoom: buildTrendDataZoom(),
        ...props.options,
      },
      series,
      tooltip: props.tooltip,
      xAxis,
      yAxis,
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

  useImperativeHandle(ref, () => ({
    getChart: () => chartRef.current,
    updateDataAt: (rowIndex, values) => {
      const chart = chartRef.current;

      if (!chart) {
        return;
      }

      const patchedSeries = normalized.seriesValues.map((seriesValues, seriesIndex) => {
        const nextValues = seriesValues.slice();
        nextValues[rowIndex] = values[seriesIndex] ?? null;
        const sourceSeries = props.series[seriesIndex] as { id?: string; name?: string } | undefined;

        return {
          data: nextValues,
          id: sourceSeries?.id,
          name: sourceSeries?.name,
        };
      });

      chart.setOption({ series: patchedSeries }, { lazyUpdate: true });
    },
  }), [normalized.seriesValues, props.series]);

  return (
    <KmsfChart
      className={props.className}
      height={props.height}
      onChartReady={(chart) => {
        chartRef.current = chart;
      }}
      onDataZoom={(payload) => {
        props.onBeforeZoom?.(payload);
        props.onAfterZoom?.(payload);
      }}
      option={option}
      style={props.style}
      theme={props.theme}
    />
  );
});
