import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import * as echarts from "echarts";
import type { ECharts, EChartsOption } from "echarts";

export interface KmsfChartHandle {
  getInstance: () => ECharts | null;
  setOption: (option: EChartsOption) => void;
}

export interface KmsfChartProps {
  className?: string;
  height?: number | string;
  onChartReady?: (chart: ECharts) => void;
  onDataZoom?: (payload: unknown, chart: ECharts) => void;
  option: EChartsOption;
  style?: CSSProperties;
  theme?: string;
}

export function KmsfChart(props: KmsfChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ECharts | null>(null);
  const frameRef = useRef<number | null>(null);
  const optionRef = useRef(props.option);
  const onDataZoomRef = useRef(props.onDataZoom);

  optionRef.current = props.option;
  onDataZoomRef.current = props.onDataZoom;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const chart = echarts.init(container, props.theme);
    chartRef.current = chart;
    chart.setOption(optionRef.current, { lazyUpdate: true });
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
    };
  }, [props.theme]);

  useEffect(() => {
    chartRef.current?.setOption(props.option, {
      lazyUpdate: true,
      notMerge: false,
    });
  }, [props.option]);

  return (
    <div
      className={props.className}
      ref={containerRef}
      style={{
        height: props.height ?? 320,
        minHeight: 160,
        width: "100%",
        ...props.style,
      }}
    />
  );
}
