import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { ECharts, EChartsOption, SeriesOption } from "echarts";

import { ChartFallback } from "../../common/ChartFallback";
import { KmsfChart } from "../../common/KmsfChart";
import { applySeriesPalette, getChartPalette } from "../../common/colors";
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
import { logChartIssuesOnce, validateChartConfig } from "../../common/validation";

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
  const validation = useMemo(
    () =>
      validateChartConfig({
        data: props.data,
        label: "TrendChart",
        requireSeries: true,
        series: props.series,
        type: "line",
      }),
    [props.data, props.series],
  );

  useEffect(() => {
    logChartIssuesOnce(validation.issues);
  }, [validation.issues]);

  const chartData = validation.valid ? props.data : [];
  const chartSeries = validation.valid ? props.series : [];
  const normalized = useMemo(() => normalizeTrendRows(chartData), [chartData]);

  const option = useMemo<EChartsOption>(() => {
    const palette = getChartPalette({
      colors: props.colors,
      themePalette: props.themeOverrides?.palette,
    });
    const baseSeries = buildTrendSeries({
      mode: props.mode ?? "line",
      series: chartSeries,
      valuesBySeries: normalized.seriesValues,
    });
    const series = applySeriesOptions(applySeriesPalette(baseSeries, palette), props.seriesOptions);
    const xAxis = normalizeAxisOption(
      props.xAxis,
      buildCategoryAxis(normalized.xAxisData),
    );
    const yAxis = normalizeAxisOption(props.yAxis, buildValueAxis(props.labelContraction ?? true));

    return buildBaseOption({
      legend: buildTrendLegendOption(props.legend),
      options: {
        ...buildThemeOption(props.theme, { ...props.themeOverrides, palette }),
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
    props.colors,
    props.legend,
    props.labelContraction,
    props.mode,
    props.options,
    chartSeries,
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
        const sourceSeries = chartSeries[seriesIndex] as { id?: string; name?: string } | undefined;

        return {
          data: nextValues,
          id: sourceSeries?.id,
          name: sourceSeries?.name,
        };
      });

      chart.setOption({ series: patchedSeries }, { lazyUpdate: true });
    },
  }), [chartSeries, normalized.seriesValues]);

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
