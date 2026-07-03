import type { EChartsOption, SeriesOption } from "echarts";

import type { GenericChartDataFormat, KmsfChartType } from "../../../src";
import { buildLiveTrendRows, chartSamples } from "./chart-samples";
import type { ChartSample, SampleClock } from "./chart-samples";
import { officialChartFixtures } from "./official-chart-fixtures";
import type { OfficialChartFixture, OfficialFixtureSection } from "./official-chart-fixtures";

export type ChartExampleTag = "정적" | "동적" | "TOP" | "Trend" | "Type" | "Native" | "Advanced";

export interface ChartExampleContext {
  clock: SampleClock;
  refreshVersion: number;
  seriesCount: number;
}

export interface ChartExampleControls {
  legend: boolean;
  refresh: boolean;
  tooltip: boolean;
}

export interface ChartExampleDefinition {
  buildData: (context: ChartExampleContext) => unknown;
  buildOptions?: (context: ChartExampleContext) => EChartsOption;
  buildSeries?: (context: ChartExampleContext) => SeriesOption[];
  controls?: ChartExampleControls;
  dataFormat?: GenericChartDataFormat;
  defaultSeriesCount?: number;
  disabledReason?: string;
  id: string;
  mode: "static" | "live";
  officialExampleId?: string;
  officialUrl?: string;
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
const LIVE_UPDATE_INTERVAL_MS = 5000;
const singleSeriesExampleTypes = new Set<KmsfChartType>([
  "funnel",
  "gauge",
  "pie",
  "sunburst",
  "themeRiver",
  "treemap",
  "wordCloud",
]);
const hiddenLegendControlTypes = new Set<KmsfChartType>([
  "bar",
  "boxplot",
  "candlestick",
  "funnel",
  "gauge",
  "heatmap",
  "lines",
  "parallel",
  "pictorialBar",
  "sankey",
  "sunburst",
  "tree",
  "treemap",
  "wordCloud",
]);
const officialFixturesByType = new Map<KmsfChartType, OfficialChartFixture[]>(
  chartSamples.map((sample) => [
    sample.type,
    officialChartFixtures.filter((fixture) => fixture.type === sample.type),
  ]),
);

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

  if (sample.category === "Advanced") {
    return "Advanced";
  }

  return "Type";
}

function getBaseTags(sample: ChartSample, mode: "static" | "live", extra: ChartExampleTag[] = []): ChartExampleTag[] {
  const tags: ChartExampleTag[] = [mode === "live" ? "동적" : "정적", getPrimaryTag(sample), ...extra];

  return Array.from(new Set(tags));
}

function buildSampleData(sample: ChartSample, context: ChartExampleContext, clock: SampleClock): unknown {
  return sample.buildData(clock, context.seriesCount);
}

function getOfficialFixture(type: KmsfChartType, section: OfficialFixtureSection) {
  return officialFixturesByType.get(type)?.find((fixture) => fixture.section === section);
}

function canUseSeriesCount(sample: ChartSample) {
  return !preparedExampleTypes.has(sample.type) && !singleSeriesExampleTypes.has(sample.type);
}

function getLiveUpdateInterval(_sample: ChartSample) {
  return LIVE_UPDATE_INTERVAL_MS;
}

function getExampleControls(sample: ChartSample): ChartExampleControls {
  return {
    legend: !hiddenLegendControlTypes.has(sample.type),
    refresh: true,
    tooltip: true,
  };
}

function sanitizeExampleId(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

function createExamples(sample: ChartSample): ChartExampleDefinition[] {
  if (sample.disabledReason) {
    return [
      {
        buildData: () => sample.buildData(staticClock, 1),
        controls: { legend: false, refresh: false, tooltip: false },
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
  const officialBasicFixture = getOfficialFixture(sample.type, "Basic");
  const controls = getExampleControls(sample);

  const examples: ChartExampleDefinition[] = [
    {
      buildData: (context) =>
        officialBasicFixture?.data ??
        buildSampleData(sample, { ...context, seriesCount: 1 }, getStaticClock(context.refreshVersion)),
      controls,
      dataFormat: officialBasicFixture?.dataFormat ?? sample.dataFormat,
      id: `${sample.type}-static-basic`,
      mode: "static",
      officialExampleId: officialBasicFixture?.officialExampleId,
      officialUrl: officialBasicFixture?.officialUrl,
      seriesCountEnabled: false,
      seriesOptions: officialBasicFixture?.seriesOptions ?? sample.seriesOptions,
      summary: officialBasicFixture?.summary ?? `${sample.summary}의 기본 사용 예제입니다.`,
      tags: getBaseTags(sample, "static"),
      title: officialBasicFixture?.title ?? "기본 예제",
      type: sample.type,
      ...(officialBasicFixture?.options
        ? { buildOptions: () => officialBasicFixture.options! }
        : sample.buildOptions
        ? { buildOptions: (context) => sample.buildOptions!(getStaticClock(context.refreshVersion), 1) }
        : {}),
      ...(officialBasicFixture?.series
        ? { buildSeries: () => officialBasicFixture.series! }
        : sample.buildSeries
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
      controls,
      dataFormat: sample.dataFormat,
      defaultSeriesCount: seriesCountEnabled ? 2 : undefined,
      id: `${sample.type}-live-update`,
      mode: "live",
      seriesCountEnabled: false,
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
  ];

  for (const fixture of (officialFixturesByType.get(sample.type) ?? []).filter((item) => item.officialExampleId !== officialBasicFixture?.officialExampleId)) {
    examples.push({
      buildData: () => fixture.data,
      controls,
      dataFormat: fixture.dataFormat ?? sample.dataFormat,
      defaultSeriesCount: undefined,
      id: `${sample.type}-official-${sanitizeExampleId(fixture.officialExampleId)}`,
      mode: "static",
      officialExampleId: fixture.officialExampleId,
      officialUrl: fixture.officialUrl,
      seriesCountEnabled: false,
      seriesOptions: fixture.seriesOptions ?? sample.seriesOptions,
      summary: fixture.summary,
      tags: getBaseTags(sample, "static", fixture.section === "Advanced" ? ["Advanced"] : ["Type"]),
      title: fixture.title,
      type: sample.type,
      ...(fixture.options ? { buildOptions: () => fixture.options! } : {}),
      ...(fixture.series ? { buildSeries: () => fixture.series! } : {}),
    });
  }

  return examples;
}

export const chartExampleGroups: Partial<Record<KmsfChartType, ChartExampleDefinition[]>> = Object.fromEntries(
  chartSamples.map((sample) => [sample.type, createExamples(sample)]),
) as Partial<Record<KmsfChartType, ChartExampleDefinition[]>>;

export function getExampleUsageCode(example: ChartExampleDefinition) {
  if (example.type === "line") {
    return `<TrendChart
  data={trendRows}
  series={[
    { id: "series-1", name: "Series 1" },
    { id: "series-2", name: "Series 2" },
  ]}
/>`;
  }

  if (example.type === "bar" || example.type === "pie" || example.type === "treemap") {
    return `<TopChart
  data={topRows}
  mode="${example.type}"
/>`;
  }

  if (example.type === "gauge") {
    return `<GaugeChart
  data={[{ name: "Score", value: 72 }]}
  seriesOptions={seriesOptions}
/>`;
  }

  if (example.type === "sunburst") {
    return `<SunburstChart
  data={data}
/>`;
  }

  if (example.type === "wordCloud") {
    return `<WordCloud
  data={data}
/>`;
  }

  if (example.type === "radar") {
    return `<RadarChart
  data={data}
  indicators={indicators}
  series={series}
/>`;
  }

  if (example.type === "heatmap") {
    return `<HeatmapChart
  data={data}
  xAxisData={xAxisData}
  yAxisData={yAxisData}
  visualMap={visualMap}
/>`;
  }

  if (example.type === "graph") {
    return `<GraphChart
  nodes={nodes}
  links={links}
  layout="force"
/>`;
  }

  if (example.type === "sankey") {
    return `<SankeyChart
  data={nodes}
  links={links}
/>`;
  }

  const dataFormatLine = example.dataFormat ? `\n  dataFormat="${example.dataFormat}"` : "";
  const optionsLine = example.buildOptions ? "\n  options={options}" : "";
  const seriesLine = example.buildSeries ? "\n  series={series}" : "";
  const seriesOptionsLine = example.seriesOptions ? "\n  seriesOptions={seriesOptions}" : "";

  return `<GenericChart
  type="${example.type}"
  data={data}${dataFormatLine}${seriesLine}${seriesOptionsLine}${optionsLine}
/>`;
}
