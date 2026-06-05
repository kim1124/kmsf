import type { EChartsOption } from "echarts";

import { GenericChart } from "../GenericChart";
import type { GenericChartProps } from "../GenericChart";

export interface RadarIndicator {
  color?: string;
  max?: number;
  min?: number;
  name: string;
}

export interface RadarChartProps extends Omit<GenericChartProps, "dataFormat" | "options" | "type"> {
  indicators: RadarIndicator[];
  options?: EChartsOption;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function RadarChart(props: RadarChartProps) {
  const { indicators, options, ...chartProps } = props;
  const radar = isRecord(options?.radar) ? options.radar : {};

  return (
    <GenericChart
      {...chartProps}
      dataFormat="native"
      options={{
        ...options,
        radar: {
          ...radar,
          indicator: indicators,
        },
      }}
      type="radar"
    />
  );
}
