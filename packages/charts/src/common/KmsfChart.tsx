import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";

export interface KmsfChartHandle {
  getInstance: () => ECharts | null;
  setOption: (option: EChartsOption) => void;
}

export interface KmsfChartProps {
  className?: string;
  height?: number | string;
  loadingFallback?: ReactNode;
  onChartReady?: (chart: ECharts) => void;
  onDataZoom?: (payload: unknown, chart: ECharts) => void;
  option: EChartsOption;
  style?: CSSProperties;
  theme?: string;
}

type SeriesIdentity = {
  id?: unknown;
  name?: unknown;
  type?: unknown;
};

function normalizeSeries(option?: EChartsOption): SeriesIdentity[] {
  const series = option?.series;

  if (!series) {
    return [];
  }

  return (Array.isArray(series) ? series : [series]) as SeriesIdentity[];
}

function hasCompatibleSeriesIdentity(previous: SeriesIdentity, next: SeriesIdentity) {
  if (previous.type !== next.type) {
    return false;
  }

  if (previous.id !== undefined || next.id !== undefined) {
    return previous.id === next.id;
  }

  if (previous.name !== undefined || next.name !== undefined) {
    return previous.name === next.name;
  }

  return true;
}

function canUseIncrementalSeriesUpdate(previousOption?: EChartsOption, nextOption?: EChartsOption) {
  const previousSeries = normalizeSeries(previousOption);
  const nextSeries = normalizeSeries(nextOption);

  if (!previousSeries.length || !nextSeries.length || previousSeries.length !== nextSeries.length) {
    return false;
  }

  return nextSeries.every((series, index) => hasCompatibleSeriesIdentity(previousSeries[index]!, series));
}

export function getKmsfChartSetOptionOptions(
  previousOption?: EChartsOption,
  nextOption?: EChartsOption,
): Parameters<ECharts["setOption"]>[1] {
  if (canUseIncrementalSeriesUpdate(previousOption, nextOption)) {
    return {
      lazyUpdate: true,
    };
  }

  return {
    lazyUpdate: true,
    replaceMerge: ["series"],
  };
}

export function KmsfChart(props: KmsfChartProps) {
  const [hasRendered, setHasRendered] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ECharts | null>(null);
  const frameRef = useRef<number | null>(null);
  const optionRef = useRef(props.option);
  const previousOptionRef = useRef<EChartsOption | null>(null);
  const onDataZoomRef = useRef(props.onDataZoom);

  optionRef.current = props.option;
  onDataZoomRef.current = props.onDataZoom;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    setHasRendered(false);

    const chart = echarts.init(container, props.theme);
    chartRef.current = chart;
    chart.setOption(optionRef.current, { lazyUpdate: true });
    previousOptionRef.current = optionRef.current;
    setHasRendered(true);
    props.onChartReady?.(chart);

    const handleDataZoom = (payload: unknown) => {
      onDataZoomRef.current?.(payload, chart);
    };

    chart.on("datazoom", handleDataZoom);

    const scheduleResize = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        chart.resize();
      });
    };

    const observer = new ResizeObserver(scheduleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.off("datazoom", handleDataZoom);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      chart.dispose();
      chartRef.current = null;
      previousOptionRef.current = null;
    };
  }, [props.theme]);

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    chart.setOption(props.option, getKmsfChartSetOptionOptions(previousOptionRef.current ?? undefined, props.option));
    previousOptionRef.current = props.option;
  }, [props.option]);

  return (
    <div
      aria-busy={props.loadingFallback ? !hasRendered : undefined}
      className={props.className}
      style={{
        height: props.height ?? 320,
        minHeight: 160,
        position: "relative",
        width: "100%",
        ...props.style,
      }}
    >
      <div
        ref={containerRef}
        style={{
          height: "100%",
          minHeight: "inherit",
          width: "100%",
        }}
      />
      {!hasRendered && props.loadingFallback ? (
        <div
          aria-hidden="true"
          style={{
            bottom: 0,
            left: 0,
            pointerEvents: "none",
            position: "absolute",
            right: 0,
            top: 0,
            zIndex: 1,
          }}
        >
          {props.loadingFallback}
        </div>
      ) : null}
    </div>
  );
}
