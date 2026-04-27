import dayjs from "dayjs";
import type { SeriesOption } from "echarts";

import type {
  NormalizedTopData,
  NormalizedTrendData,
  TopChartMode,
  TopChartRow,
  TrendChartMode,
  TrendChartRow,
} from "./types";

function toDisplayTime(value: string | Date): string {
  if (value instanceof Date) {
    return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
  }

  return value;
}

function getValueColumnCount(rows: Array<[unknown, ...Array<unknown>]>): number {
  return rows.reduce((max, row) => Math.max(max, row.length - 1), 0);
}

export function normalizeTrendRows(rows: TrendChartRow[]): NormalizedTrendData {
  const seriesCount = getValueColumnCount(rows);
  const seriesValues = Array.from({ length: seriesCount }, () => new Array<number | null>());
  const xAxisData: string[] = [];

  for (const row of rows) {
    const [xValue, ...values] = row;
    xAxisData.push(toDisplayTime(xValue));

    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
      seriesValues[seriesIndex]?.push(values[seriesIndex] ?? null);
    }
  }

  return { xAxisData, seriesValues };
}

export function normalizeTopRows(rows: TopChartRow[]): NormalizedTopData {
  const seriesCount = Math.max(1, getValueColumnCount(rows));
  const seriesValues = Array.from({ length: seriesCount }, () => new Array<number | null>());
  const categories: string[] = [];

  for (const row of rows) {
    const [category, ...values] = row;
    categories.push(category);

    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex += 1) {
      seriesValues[seriesIndex]?.push(values[seriesIndex] ?? null);
    }
  }

  return { categories, seriesValues };
}

export interface BuildTrendSeriesInput {
  mode: TrendChartMode;
  series: SeriesOption[];
  valuesBySeries: Array<Array<number | null>>;
}

export function buildTrendSeries(input: BuildTrendSeriesInput): SeriesOption[] {
  return input.series.map((seriesItem, seriesIndex) => ({
    ...seriesItem,
    animation: false,
    animationDurationUpdate: 0,
    animationEasingUpdate: "linear",
    type: "line",
    showSymbol: false,
    sampling: "lttb",
    areaStyle: input.mode === "area" ? {} : undefined,
    data: input.valuesBySeries[seriesIndex] ?? [],
  }) as SeriesOption);
}

export interface BuildTopSeriesInput {
  categories: string[];
  mode: TopChartMode;
  series?: SeriesOption[];
  valuesBySeries: Array<Array<number | null>>;
}

export function buildTopSeries(input: BuildTopSeriesInput): SeriesOption[] {
  const baseSeries = input.series?.length ? input.series : [{ name: "Series 1" }];

  return baseSeries.map((seriesItem, seriesIndex) => {
    const values = input.valuesBySeries[seriesIndex] ?? input.valuesBySeries[0] ?? [];

    if (input.mode === "pie" || input.mode === "treemap") {
      return {
        ...seriesItem,
        type: input.mode,
        data: input.categories.map((name, categoryIndex) => ({
          name,
          value: values[categoryIndex] ?? null,
        })),
      } as SeriesOption;
    }

    return {
      ...seriesItem,
      type: "bar",
      data: values,
    } as SeriesOption;
  });
}
