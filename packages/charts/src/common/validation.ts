import type { EChartsOption, SeriesOption } from "echarts";

import type { GenericChartDataFormat, KmsfChartType } from "./generic-chart";
import type { SeriesOverride } from "./types";

export type ChartValidationLevel = "error" | "warning";

export interface ChartValidationIssue {
  code: string;
  level: ChartValidationLevel;
  message: string;
  missingPath?: string;
  type: KmsfChartType;
}

export interface ChartValidationResult {
  valid: boolean;
  issues: ChartValidationIssue[];
}

interface ChartValidationInput {
  data: unknown;
  dataFormat?: GenericChartDataFormat;
  label?: string;
  options?: EChartsOption;
  requireSeries?: boolean;
  series?: SeriesOption[];
  seriesOptions?: SeriesOverride;
  type: KmsfChartType;
}

const loggedIssues = new Set<string>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOptionPath(value: unknown, path: string[]): boolean {
  let current = value;

  for (const key of path) {
    if (!isRecord(current) || !(key in current)) {
      return false;
    }

    current = current[key];
  }

  return current !== undefined && current !== null;
}

function hasRecordKey(value: unknown, key: string): boolean {
  return isRecord(value) && key in value && value[key] !== undefined && value[key] !== null;
}

function hasSeriesKey(series: SeriesOption[] | undefined, key: string): boolean {
  return Boolean(series?.some((item) => hasRecordKey(item, key)));
}

function hasSeriesOptionsKey(seriesOptions: SeriesOverride | undefined, key: string): boolean {
  if (Array.isArray(seriesOptions)) {
    return seriesOptions.some((item) => hasRecordKey(item, key));
  }

  return hasRecordKey(seriesOptions, key);
}

function hasRadarIndicator(options: EChartsOption | undefined): boolean {
  const radar = (options as { radar?: unknown } | undefined)?.radar;

  if (Array.isArray(radar)) {
    return radar.some((item) => hasOptionPath(item, ["indicator"]));
  }

  return hasOptionPath(radar, ["indicator"]);
}

function hasAnyOption(options: EChartsOption | undefined, keys: string[]): boolean {
  return keys.every((key) => hasOptionPath(options, [key]));
}

function error(type: KmsfChartType, code: string, missingPath: string, message: string): ChartValidationIssue {
  return { code, level: "error", message, missingPath, type };
}

function getChartLabel(input: ChartValidationInput): string {
  return input.label ?? input.type;
}

export function validateChartConfig(input: ChartValidationInput): ChartValidationResult {
  const issues: ChartValidationIssue[] = [];
  const label = getChartLabel(input);

  if (input.data === undefined || input.data === null) {
    issues.push(error(input.type, "chart.data.required", "data", `${label} requires data.`));
  }

  if (input.requireSeries && !input.series?.length) {
    issues.push(error(input.type, "chart.series.required", "series", `${label} requires series.`));
  }

  if (input.type === "candlestick" && !hasAnyOption(input.options, ["xAxis", "yAxis"])) {
    issues.push(error("candlestick", "candlestick.axes.required", "options.xAxis/options.yAxis", "Candlestick requires xAxis and yAxis."));
  }

  if (input.type === "radar" && !hasRadarIndicator(input.options)) {
    issues.push(error("radar", "radar.indicator.required", "options.radar.indicator", "Radar requires options.radar.indicator."));
  }

  if (input.type === "heatmap" && !hasAnyOption(input.options, ["xAxis", "yAxis", "visualMap"])) {
    issues.push(error("heatmap", "heatmap.options.required", "options.xAxis/options.yAxis/options.visualMap", "Heatmap requires xAxis, yAxis, and visualMap."));
  }

  if (
    input.type === "lines" &&
    !hasSeriesOptionsKey(input.seriesOptions, "coordinateSystem") &&
    !hasSeriesKey(input.series, "coordinateSystem")
  ) {
    issues.push(error("lines", "lines.coordinateSystem.required", "seriesOptions.coordinateSystem", "Lines requires coordinateSystem."));
  }

  if (input.type === "graph" && !hasSeriesKey(input.series, "links")) {
    issues.push(error("graph", "graph.links.required", "series[].links", "Graph requires series links."));
  }

  if (input.type === "boxplot" && !hasAnyOption(input.options, ["xAxis", "yAxis"])) {
    issues.push(error("boxplot", "boxplot.axes.required", "options.xAxis/options.yAxis", "Boxplot requires xAxis and yAxis."));
  }

  if (input.type === "parallel" && !hasOptionPath(input.options, ["parallelAxis"])) {
    issues.push(error("parallel", "parallel.axis.required", "options.parallelAxis", "Parallel requires options.parallelAxis."));
  }

  if (input.type === "sankey" && !hasSeriesKey(input.series, "links")) {
    issues.push(error("sankey", "sankey.links.required", "series[].links", "Sankey requires series links."));
  }

  if (input.type === "themeRiver" && !hasOptionPath(input.options, ["singleAxis"])) {
    issues.push(error("themeRiver", "themeRiver.singleAxis.required", "options.singleAxis", "ThemeRiver requires options.singleAxis."));
  }

  if (input.type === "map" && !hasSeriesOptionsKey(input.seriesOptions, "map") && !hasSeriesKey(input.series, "map")) {
    issues.push(error("map", "map.resource.required", "seriesOptions.map", "Map requires a registered map name."));
  }

  if (input.type === "custom" && !hasSeriesKey(input.series, "renderItem")) {
    issues.push(error("custom", "custom.renderItem.required", "series[].renderItem", "Custom chart requires series renderItem."));
  }

  return { issues, valid: issues.every((issue) => issue.level !== "error") };
}

export function logChartIssuesOnce(issues: ChartValidationIssue[]) {
  for (const issue of issues) {
    const key = `${issue.type}:${issue.code}:${issue.message}`;

    if (loggedIssues.has(key)) {
      continue;
    }

    loggedIssues.add(key);

    if (issue.level === "error") {
      console.error("[KMSF Charts]", issue.message);
      continue;
    }

    console.warn("[KMSF Charts]", issue.message);
  }
}
