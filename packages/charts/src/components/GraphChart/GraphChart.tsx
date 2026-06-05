import type { EChartsOption, SeriesOption } from "echarts";

import { GenericChart } from "../GenericChart";
import type { GenericChartProps } from "../GenericChart";

export interface GraphNode {
  category?: number | string;
  id?: string;
  name: string;
  symbolSize?: number;
  value?: number;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value?: number;
}

export interface GraphChartProps extends Omit<GenericChartProps, "data" | "dataFormat" | "options" | "series" | "type"> {
  data?: unknown;
  layout?: "circular" | "force" | "none";
  links: GraphLink[];
  nodes: GraphNode[];
  options?: EChartsOption;
  series?: SeriesOption[];
}

export function GraphChart(props: GraphChartProps) {
  const { data, layout, links, nodes, options, series, ...chartProps } = props;
  const graphSeries = series?.length
    ? series
    : [
        {
          data: nodes,
          layout: layout ?? "force",
          links,
        } as SeriesOption,
      ];

  return (
    <GenericChart
      {...chartProps}
      data={data ?? nodes}
      dataFormat="native"
      options={options}
      series={graphSeries}
      type="graph"
    />
  );
}
