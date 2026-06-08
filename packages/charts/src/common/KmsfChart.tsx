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

export function getKmsfChartSetOptionOptions(): Parameters<ECharts["setOption"]>[1] {
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
    };
  }, [props.theme]);

  useEffect(() => {
    chartRef.current?.setOption(props.option, getKmsfChartSetOptionOptions());
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
