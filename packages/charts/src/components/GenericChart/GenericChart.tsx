import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { ChartFallback } from "../../common/ChartFallback";
import { KmsfChart } from "../../common/KmsfChart";
import { buildGenericChartOption } from "../../common/generic-chart";
import type { BuildGenericChartOptionInput } from "../../common/generic-chart";
import { logChartIssuesOnce, validateChartConfig } from "../../common/validation";

let isWordCloudExtensionRegistered = false;

export interface GenericChartProps extends BuildGenericChartOptionInput {
  className?: string;
  height?: number | string;
  loadingFallback?: ReactNode;
  style?: CSSProperties;
}

function renderPendingFallback(props: Pick<GenericChartProps, "className" | "height" | "loadingFallback" | "style">) {
  return (
    <div
      className={props.className}
      style={{
        height: props.height ?? 320,
        minHeight: 160,
        width: "100%",
        ...props.style,
      }}
    >
      {props.loadingFallback}
    </div>
  );
}

export function GenericChart(props: GenericChartProps) {
  const [isWordCloudReady, setIsWordCloudReady] = useState(isWordCloudExtensionRegistered);

  useEffect(() => {
    if (props.type !== "wordCloud") {
      return undefined;
    }

    if (isWordCloudExtensionRegistered) {
      setIsWordCloudReady(true);
      return undefined;
    }

    let mounted = true;

    void import("echarts-wordcloud").then(() => {
      isWordCloudExtensionRegistered = true;

      if (mounted) {
        setIsWordCloudReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [props.type]);

  const validation = useMemo(
    () =>
      validateChartConfig({
        data: props.data,
        dataFormat: props.dataFormat,
        label: "GenericChart",
        options: props.options,
        series: props.series,
        seriesOptions: props.seriesOptions,
        type: props.type,
      }),
    [props.data, props.dataFormat, props.options, props.series, props.seriesOptions, props.type],
  );

  useEffect(() => {
    logChartIssuesOnce(validation.issues);
  }, [validation.issues]);

  const option = useMemo(
    () =>
      buildGenericChartOption({
        colors: props.colors,
        data: validation.valid ? props.data : [],
        dataFormat: props.dataFormat,
        labelContraction: props.labelContraction,
        legend: props.legend,
        options: props.options,
        series: props.series,
        seriesOptions: props.seriesOptions,
        theme: props.theme,
        themeOverrides: props.themeOverrides,
        tooltip: props.tooltip,
        type: props.type,
        xAxis: props.xAxis,
        yAxis: props.yAxis,
      }),
    [
      props.data,
      props.dataFormat,
      props.colors,
      props.labelContraction,
      props.legend,
      props.options,
      props.series,
      props.seriesOptions,
      props.theme,
      props.themeOverrides,
      props.tooltip,
      props.type,
      props.xAxis,
      props.yAxis,
      validation.valid,
    ],
  );

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

  if (props.type === "wordCloud" && !isWordCloudReady) {
    return renderPendingFallback(props);
  }

  return (
    <KmsfChart
      className={props.className}
      height={props.height}
      key={props.type}
      loadingFallback={props.loadingFallback}
      option={option}
      style={props.style}
      theme={props.theme}
    />
  );
}
