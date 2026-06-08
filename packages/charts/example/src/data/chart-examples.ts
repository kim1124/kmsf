import type { EChartsOption, SeriesOption } from "echarts";

import type { GenericChartDataFormat, KmsfChartType } from "../../../src";
import { getExamplePalette } from "./chart-colors";
import { buildLiveTrendRows, chartSamples } from "./chart-samples";
import type { ChartSample, SampleClock } from "./chart-samples";

export type ChartExampleTag = "정적" | "동적" | "TOP" | "Trend" | "Type" | "Native";

export interface ChartExampleContext {
  clock: SampleClock;
  refreshVersion: number;
  seriesCount: number;
}

export interface ChartExampleDefinition {
  buildData: (context: ChartExampleContext) => unknown;
  buildOptions?: (context: ChartExampleContext) => EChartsOption;
  buildSeries?: (context: ChartExampleContext) => SeriesOption[];
  dataFormat?: GenericChartDataFormat;
  defaultSeriesCount?: number;
  disabledReason?: string;
  id: string;
  mode: "static" | "live";
  seriesCountEnabled?: boolean;
  seriesOptions?: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  summary: string;
  tags: ChartExampleTag[];
  title: string;
  type: KmsfChartType;
  updateIntervalMs?: number;
}

const staticClock: SampleClock = {
  flowTick: 0,
  topTick: 0,
  trendTick: 0,
};

const preparedExampleTypes = new Set<KmsfChartType>(["custom", "map"]);
const TREND_UPDATE_INTERVAL_MS = 1000;
const TOP_UPDATE_INTERVAL_MS = 5000;
const SLOW_UPDATE_INTERVAL_MS = 10000;
const singleSeriesExampleTypes = new Set<KmsfChartType>([
  "funnel",
  "gauge",
  "pie",
  "sunburst",
  "themeRiver",
  "treemap",
  "wordCloud",
]);

export function clampExampleSeriesCount(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(10, Math.max(1, Math.round(value)));
}

function offsetClock(clock: SampleClock, refreshVersion: number): SampleClock {
  const offset = refreshVersion * 13;

  return {
    flowTick: clock.flowTick + offset,
    topTick: clock.topTick + offset,
    trendTick: clock.trendTick + offset,
  };
}

function getStaticClock(refreshVersion: number): SampleClock {
  return offsetClock(staticClock, refreshVersion);
}

function getPrimaryTag(sample: ChartSample): ChartExampleTag {
  if (sample.category === "Trend") {
    return "Trend";
  }

  if (sample.category === "Top") {
    return "TOP";
  }

  if (sample.category === "Native") {
    return "Native";
  }

  return "Type";
}

function getBaseTags(sample: ChartSample, mode: "static" | "live", extra: ChartExampleTag[] = []): ChartExampleTag[] {
  const tags: ChartExampleTag[] = [mode === "live" ? "동적" : "정적", getPrimaryTag(sample), ...extra];

  return Array.from(new Set(tags));
}

function mergePlainObjects<TValue extends Record<string, unknown>>(base: TValue, override?: Record<string, unknown>): TValue {
  if (!override) {
    return base;
  }

  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = result[key];

    if (
      current &&
      value &&
      typeof current === "object" &&
      typeof value === "object" &&
      !Array.isArray(current) &&
      !Array.isArray(value)
    ) {
      result[key] = mergePlainObjects(current as Record<string, unknown>, value as Record<string, unknown>);
      continue;
    }

    result[key] = value;
  }

  return result as TValue;
}

function buildSampleData(sample: ChartSample, context: ChartExampleContext, clock: SampleClock): unknown {
  return sample.buildData(clock, context.seriesCount);
}

function canUseSeriesCount(sample: ChartSample) {
  return !preparedExampleTypes.has(sample.type) && !singleSeriesExampleTypes.has(sample.type);
}

function getLiveUpdateInterval(sample: ChartSample) {
  if (sample.category === "Trend") {
    return TREND_UPDATE_INTERVAL_MS;
  }

  if (sample.category === "Top") {
    return TOP_UPDATE_INTERVAL_MS;
  }

  return SLOW_UPDATE_INTERVAL_MS;
}

function buildOptionVariant(sample: ChartSample, clock: SampleClock, variant = 0): EChartsOption {
  const baseOptions = (sample.buildOptions?.(clock, 3) ?? {}) as Record<string, unknown>;
  const palette = getExamplePalette(variant + 2);
  const commonOptions: Record<string, unknown> = {
    color: palette,
  };
  const typeOptions: Partial<Record<KmsfChartType, Record<string, unknown>>> = {
    bar: {
      grid: { bottom: 36, left: 24, right: 16, top: 28 },
      xAxis: { axisLabel: { rotate: 20 } },
    },
    boxplot: {
      grid: { bottom: 32, left: 32, right: 18, top: 28 },
      yAxis: { splitLine: { lineStyle: { type: "dashed" } } },
    },
    candlestick: {
      grid: { bottom: 38, left: 28, right: 18, top: 26 },
      yAxis: { scale: true },
    },
    effectScatter: {
      xAxis: { boundaryGap: false },
      yAxis: { splitLine: { lineStyle: { type: "dashed" } } },
    },
    funnel: {
      legend: { bottom: 0, top: undefined },
    },
    gauge: {
      legend: false,
    },
    graph: {
      legend: { top: 8 },
    },
    heatmap: {
      visualMap: { bottom: 4, left: "center", orient: "horizontal" },
    },
    line: {
      dataZoom: [{ type: "inside" }],
      xAxis: { boundaryGap: false },
      yAxis: { splitLine: { lineStyle: { type: "dashed" } } },
    },
    lines: {
      grid: { bottom: 28, left: 28, right: 20, top: 28 },
    },
    parallel: {
      parallel: { bottom: 28, left: 58, right: 30, top: 64 },
    },
    pictorialBar: {
      grid: { bottom: 34, left: 24, right: 16, top: 28 },
    },
    pie: {
      legend: { orient: "vertical", right: 8, top: 36, type: "scroll" },
    },
    radar: {
      legend: { top: 8 },
      radar: { center: ["50%", "62%"], radius: "46%", splitNumber: 4 },
    },
    sankey: {
      legend: false,
    },
    scatter: {
      xAxis: { boundaryGap: false },
      yAxis: { splitLine: { lineStyle: { type: "dashed" } } },
    },
    sunburst: {
      legend: false,
    },
    themeRiver: {
      singleAxis: { bottom: 38, left: 48, right: 24, top: 64, type: "time" },
    },
    tree: {
      legend: { top: 8 },
    },
    treemap: {
      legend: false,
    },
    wordCloud: {
      legend: false,
    },
  };

  return mergePlainObjects(mergePlainObjects(baseOptions, commonOptions), typeOptions[sample.type]) as EChartsOption;
}

function buildOptionSeries(sample: ChartSample, variant = 0): Partial<SeriesOption> | Array<Partial<SeriesOption>> | undefined {
  if (sample.seriesOptions) {
    return sample.seriesOptions;
  }

  if (sample.type === "line") {
    return variant % 2 === 0 ? { areaStyle: {}, smooth: true } : { lineStyle: { width: 3 }, smooth: true };
  }

  if (sample.type === "bar") {
    return variant % 2 === 0 ? { barMaxWidth: 18 } : { barGap: "24%", barMaxWidth: 26 };
  }

  if (sample.type === "pie") {
    return variant % 2 === 0
      ? { center: ["34%", "52%"], radius: ["42%", "72%"] }
      : { center: ["36%", "52%"], roseType: "radius", radius: ["24%", "72%"] };
  }

  if (sample.type === "scatter" || sample.type === "effectScatter") {
    return variant % 2 === 0 ? { symbolSize: 10 } : { symbol: "diamond", symbolSize: 14 };
  }

  if (sample.type === "tree") {
    return variant % 2 === 0 ? { symbolSize: 8 } : { edgeShape: "polyline", symbolSize: 10 };
  }

  if (sample.type === "sankey") {
    return variant % 2 === 0 ? { lineStyle: { opacity: 0.35 } } : { nodeGap: 10, nodeWidth: 12 };
  }

  if (sample.type === "themeRiver") {
    return variant % 2 === 0 ? { emphasis: { focus: "series" } } : { label: { show: false } };
  }

  return variant % 2 === 0
    ? { emphasis: { focus: "series" } }
    : { emphasis: { focus: "self" }, selectedMode: "single" };
}

function createExamples(sample: ChartSample): ChartExampleDefinition[] {
  if (sample.disabledReason) {
    return [
      {
        buildData: () => sample.buildData(staticClock, 1),
        dataFormat: sample.dataFormat,
        disabledReason: sample.disabledReason,
        id: `${sample.type}-placeholder`,
        mode: "static",
        summary: sample.disabledReason,
        tags: getBaseTags(sample, "static", ["Type"]),
        title: "준비 필요",
        type: sample.type,
      },
    ];
  }

  const seriesCountEnabled = canUseSeriesCount(sample);

  return [
    {
      buildData: (context) => buildSampleData(sample, { ...context, seriesCount: 1 }, getStaticClock(context.refreshVersion)),
      dataFormat: sample.dataFormat,
      id: `${sample.type}-static-basic`,
      mode: "static",
      seriesCountEnabled: singleSeriesExampleTypes.has(sample.type) ? false : undefined,
      seriesOptions: sample.seriesOptions,
      summary: `${sample.summary}의 기본 사용 예제입니다.`,
      tags: getBaseTags(sample, "static"),
      title: "기본 예제",
      type: sample.type,
      ...(sample.buildOptions
        ? { buildOptions: (context) => sample.buildOptions!(getStaticClock(context.refreshVersion), 1) }
        : {}),
      ...(sample.buildSeries
        ? { buildSeries: (context) => sample.buildSeries!(getStaticClock(context.refreshVersion), 1) }
        : {}),
    },
    {
      buildData: (context) => {
        const nextClock = offsetClock(context.clock, context.refreshVersion);

        if (sample.type === "line") {
          return buildLiveTrendRows(nextClock.trendTick, context.seriesCount);
        }

        return buildSampleData(sample, context, nextClock);
      },
      dataFormat: sample.dataFormat,
      defaultSeriesCount: seriesCountEnabled ? 3 : undefined,
      id: `${sample.type}-live-update`,
      mode: "live",
      seriesCountEnabled,
      seriesOptions: sample.seriesOptions,
      summary: `${sample.summary}를 실시간 데이터 갱신 조건에서 확인합니다.`,
      tags: getBaseTags(sample, "live"),
      title: "실시간 갱신",
      type: sample.type,
      updateIntervalMs: getLiveUpdateInterval(sample),
      ...(sample.buildOptions
        ? { buildOptions: (context) => sample.buildOptions!(offsetClock(context.clock, context.refreshVersion), context.seriesCount) }
        : {}),
      ...(sample.buildSeries
        ? { buildSeries: (context) => sample.buildSeries!(offsetClock(context.clock, context.refreshVersion), context.seriesCount) }
        : {}),
    },
    {
      buildData: (context) => {
        const nextClock = getStaticClock(context.refreshVersion + 2);

        return buildSampleData(sample, context, nextClock);
      },
      buildOptions: (context) => buildOptionVariant(sample, getStaticClock(context.refreshVersion + 2)),
      dataFormat: sample.dataFormat,
      defaultSeriesCount: seriesCountEnabled ? 3 : undefined,
      id: `${sample.type}-option-variant`,
      mode: "static",
      seriesCountEnabled,
      seriesOptions: buildOptionSeries(sample),
      summary: `${sample.summary}에 자주 쓰는 시각 옵션을 적용한 예제입니다.`,
      tags: getBaseTags(sample, "static", ["Type"]),
      title: "옵션 변형",
      type: sample.type,
      ...(sample.buildSeries
        ? { buildSeries: (context) => sample.buildSeries!(getStaticClock(context.refreshVersion + 2), context.seriesCount) }
        : {}),
    },
    {
      buildData: (context) => buildSampleData(sample, context, getStaticClock(context.refreshVersion + 4)),
      buildOptions: (context) => buildOptionVariant(sample, getStaticClock(context.refreshVersion + 4), 1),
      dataFormat: sample.dataFormat,
      defaultSeriesCount: seriesCountEnabled ? 2 : undefined,
      id: `${sample.type}-data-variant`,
      mode: "static",
      seriesCountEnabled,
      seriesOptions: buildOptionSeries(sample, 1),
      summary: `${sample.summary}의 데이터 분포를 다르게 구성한 예제입니다.`,
      tags: getBaseTags(sample, "static", ["Type"]),
      title: "데이터 변형",
      type: sample.type,
      ...(sample.buildSeries
        ? { buildSeries: (context) => sample.buildSeries!(getStaticClock(context.refreshVersion + 4), context.seriesCount) }
        : {}),
    },
    {
      buildData: (context) => buildSampleData(sample, context, getStaticClock(context.refreshVersion + 7)),
      buildOptions: (context) => buildOptionVariant(sample, getStaticClock(context.refreshVersion + 7), 2),
      dataFormat: sample.dataFormat,
      defaultSeriesCount: seriesCountEnabled ? 3 : undefined,
      id: `${sample.type}-layout-variant`,
      mode: "static",
      seriesCountEnabled,
      seriesOptions: buildOptionSeries(sample, 2),
      summary: `${sample.summary}의 레이아웃과 강조 표현을 바꾼 예제입니다.`,
      tags: getBaseTags(sample, "static", ["Type"]),
      title: "레이아웃 변형",
      type: sample.type,
      ...(sample.buildSeries
        ? { buildSeries: (context) => sample.buildSeries!(getStaticClock(context.refreshVersion + 7), context.seriesCount) }
        : {}),
    },
  ];
}

export const chartExampleGroups: Partial<Record<KmsfChartType, ChartExampleDefinition[]>> = Object.fromEntries(
  chartSamples.map((sample) => [sample.type, createExamples(sample)]),
) as Partial<Record<KmsfChartType, ChartExampleDefinition[]>>;

export function getExampleUsageCode(example: ChartExampleDefinition) {
  const dataFormatLine = example.dataFormat ? `\n  dataFormat="${example.dataFormat}"` : "";
  const optionsLine = example.buildOptions ? "\n  options={options}" : "";
  const seriesLine = example.buildSeries ? "\n  series={series}" : "";
  const seriesOptionsLine = example.seriesOptions ? "\n  seriesOptions={seriesOptions}" : "";

  return `<GenericChart
  type="${example.type}"
  data={data}${dataFormatLine}${seriesLine}${seriesOptionsLine}${optionsLine}
/>`;
}
