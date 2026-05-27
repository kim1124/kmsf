import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { KmsfChart } from "../../common/KmsfChart";
import { buildGenericChartOption } from "../../common/generic-chart";
import type { BuildGenericChartOptionInput } from "../../common/generic-chart";

let isWordCloudExtensionRegistered = false;

export interface GenericChartProps extends BuildGenericChartOptionInput {
  className?: string;
  height?: number | string;
  style?: CSSProperties;
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

  const option = useMemo(
    () =>
      buildGenericChartOption({
        data: props.data,
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
    ],
  );

  if (props.type === "wordCloud" && !isWordCloudReady) {
    return (
      <div
        className={props.className}
        style={{
          height: props.height ?? 320,
          minHeight: 160,
          width: "100%",
          ...props.style,
        }}
      />
    );
  }

  return (
    <KmsfChart
      className={props.className}
      height={props.height}
      key={props.type}
      option={option}
      style={props.style}
      theme={props.theme}
    />
  );
}
