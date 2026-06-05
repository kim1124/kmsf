import { useEffect, useMemo } from "react";
import type { EChartsOption } from "echarts";

import { ChartFallback } from "../../common/ChartFallback";
import type { ChartValidationIssue } from "../../common/validation";
import { logChartIssuesOnce } from "../../common/validation";
import { GenericChart } from "../GenericChart";
import type { GenericChartProps } from "../GenericChart";

export type HeatmapAxisValue = string | number;

export interface HeatmapChartProps extends Omit<GenericChartProps, "dataFormat" | "options" | "type"> {
  options?: EChartsOption;
  visualMap?: EChartsOption["visualMap"];
  xAxisData: HeatmapAxisValue[];
  yAxisData: HeatmapAxisValue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function HeatmapChart(props: HeatmapChartProps) {
  const { options, visualMap, xAxisData, yAxisData, ...chartProps } = props;
  const xAxis = isRecord(options?.xAxis) ? options.xAxis : {};
  const yAxis = isRecord(options?.yAxis) ? options.yAxis : {};
  const validationIssues = useMemo<ChartValidationIssue[]>(() => {
    if (Array.isArray(xAxisData) && Array.isArray(yAxisData)) {
      return [];
    }

    return [
      {
        code: "heatmap.axisData.required",
        level: "error",
        message: "HeatmapChart requires xAxisData and yAxisData.",
        missingPath: "xAxisData/yAxisData",
        type: "heatmap",
      },
    ];
  }, [xAxisData, yAxisData]);

  useEffect(() => {
    logChartIssuesOnce(validationIssues);
  }, [validationIssues]);

  if (validationIssues.length > 0) {
    return (
      <ChartFallback
        className={chartProps.className}
        height={chartProps.height}
        message={validationIssues[0]?.message ?? "Invalid chart configuration."}
        style={chartProps.style}
      />
    );
  }

  return (
    <GenericChart
      {...chartProps}
      dataFormat="native"
      options={{
        ...options,
        visualMap: visualMap ?? options?.visualMap ?? { max: 100, min: 0 },
        xAxis: {
          ...xAxis,
          data: xAxisData,
          type: "category",
        },
        yAxis: {
          ...yAxis,
          data: yAxisData,
          type: "category",
        },
      }}
      type="heatmap"
    />
  );
}
