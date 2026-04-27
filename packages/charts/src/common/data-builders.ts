import type { TopChartRow, TrendChartRow } from "./types";

export interface TrendRowInput {
  x: string | Date;
  value?: number | null;
  values?: Array<number | null>;
}

export interface TopRowInput {
  name: string;
  value?: number | null;
  values?: Array<number | null>;
}

function normalizeValues(input: { value?: number | null; values?: Array<number | null> }) {
  if (input.values) {
    return input.values;
  }

  if ("value" in input) {
    return [input.value ?? null];
  }

  return [];
}

export function createTrendRows(rows: TrendRowInput[]): TrendChartRow[] {
  return rows.map((row) => [row.x, ...normalizeValues(row)]);
}

export function createTopRows(rows: TopRowInput[]): TopChartRow[] {
  return rows.map((row) => [row.name, ...normalizeValues(row)]);
}
