import type { EChartsOption, SeriesOption } from "echarts";

import type { GenericChartDataFormat, KmsfChartType } from "../../../src";
import {
  buildTopRows,
  buildTopRowsWithSeries,
  buildTrendRows,
  chartSamples,
} from "./chart-samples";
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
}

const staticClock: SampleClock = {
  flowTick: 0,
  topTick: 0,
  trendTick: 0,
};

const seriesCountTypes = new Set<KmsfChartType>(["bar", "line"]);

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
  if (sample.type === "line") {
    return buildTrendRows(clock.trendTick, context.seriesCount);
  }

  if (sample.type === "bar" && context.seriesCount > 1) {
    return buildTopRowsWithSeries(clock.topTick, context.seriesCount);
  }

  return sample.buildData(clock);
}

function buildOptionVariant(sample: ChartSample, clock: SampleClock): EChartsOption {
  const baseOptions = (sample.buildOptions?.(clock) ?? {}) as Record<string, unknown>;

  return mergePlainObjects(baseOptions, {
    title: {
      left: "center",
      text: `${sample.type} option variant`,
      textStyle: { fontSize: 12 },
    },
  }) as EChartsOption;
}

function buildOptionSeries(sample: ChartSample): Partial<SeriesOption> | Array<Partial<SeriesOption>> | undefined {
  if (sample.seriesOptions) {
    return sample.seriesOptions;
  }

  if (sample.type === "line") {
    return { areaStyle: {}, smooth: true };
  }

  if (sample.type === "bar") {
    return { barMaxWidth: 18 };
  }

  if (sample.type === "pie") {
    return { radius: ["42%", "72%"] };
  }

  if (sample.type === "scatter" || sample.type === "effectScatter") {
    return { symbolSize: 10 };
  }

  return { emphasis: { focus: "series" } };
}

function createExamples(sample: ChartSample): ChartExampleDefinition[] {
  if (sample.disabledReason) {
    return [
      {
        buildData: () => sample.buildData(staticClock),
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

  const seriesCountEnabled = seriesCountTypes.has(sample.type);

  return [
    {
      buildData: (context) => buildSampleData(sample, { ...context, seriesCount: 1 }, getStaticClock(context.refreshVersion)),
      dataFormat: sample.dataFormat,
      id: `${sample.type}-static-basic`,
      mode: "static",
      seriesOptions: sample.seriesOptions,
      summary: `${sample.summary}의 기본 사용 예제입니다.`,
      tags: getBaseTags(sample, "static"),
      title: "기본 예제",
      type: sample.type,
      ...(sample.buildOptions
        ? { buildOptions: (context) => sample.buildOptions!(getStaticClock(context.refreshVersion)) }
        : {}),
      ...(sample.buildSeries
        ? { buildSeries: (context) => sample.buildSeries!(getStaticClock(context.refreshVersion)) }
        : {}),
    },
    {
      buildData: (context) => buildSampleData(sample, context, offsetClock(context.clock, context.refreshVersion)),
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
      ...(sample.buildOptions
        ? { buildOptions: (context) => sample.buildOptions!(offsetClock(context.clock, context.refreshVersion)) }
        : {}),
      ...(sample.buildSeries
        ? { buildSeries: (context) => sample.buildSeries!(offsetClock(context.clock, context.refreshVersion)) }
        : {}),
    },
    {
      buildData: (context) => {
        const nextClock = getStaticClock(context.refreshVersion + 2);

        if (sample.type === "bar") {
          return buildTopRowsWithSeries(nextClock.topTick, context.seriesCount);
        }

        if (sample.type === "line") {
          return buildTrendRows(nextClock.trendTick, Math.max(2, context.seriesCount));
        }

        if (sample.type === "pie" || sample.type === "funnel" || sample.type === "treemap" || sample.type === "pictorialBar") {
          return buildTopRows(nextClock.topTick);
        }

        return sample.buildData(nextClock);
      },
      buildOptions: (context) => buildOptionVariant(sample, getStaticClock(context.refreshVersion + 2)),
      dataFormat: sample.dataFormat,
      defaultSeriesCount: sample.type === "bar" ? 3 : sample.type === "line" ? 2 : undefined,
      id: `${sample.type}-option-variant`,
      mode: "static",
      seriesCountEnabled: sample.type === "bar",
      seriesOptions: buildOptionSeries(sample),
      summary: `${sample.summary}에 자주 쓰는 시각 옵션을 적용한 예제입니다.`,
      tags: getBaseTags(sample, "static", ["Type"]),
      title: "옵션 변형",
      type: sample.type,
      ...(sample.buildSeries
        ? { buildSeries: (context) => sample.buildSeries!(getStaticClock(context.refreshVersion + 2)) }
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
