import type { KmsfChartType } from "../../../src";

const examplePalette = [
  "#064e3b",
  "#047857",
  "#059669",
  "#10b981",
  "#14b8a6",
  "#0d9488",
  "#0f766e",
  "#2dd4bf",
  "#34d399",
  "#5eead4",
] as const;

const topItemColorTypes = new Set<KmsfChartType>([
  "bar",
  "funnel",
  "pictorialBar",
  "pie",
  "treemap",
]);

export type TopItem = {
  itemStyle?: Record<string, unknown>;
  name: string;
  value: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function appendTupleMetadata(row: unknown[], metadata: Record<string, unknown>): unknown[] {
  const lastValue = row[row.length - 1];

  if (isPlainObject(lastValue)) {
    return [
      ...row.slice(0, -1),
      {
        ...lastValue,
        ...metadata,
      },
    ];
  }

  return [...row, metadata];
}

export function getExamplePalette(offset = 0): string[] {
  if (offset === 0) {
    return [...examplePalette];
  }

  return examplePalette.map((_, index) => examplePalette[(index + offset) % examplePalette.length]!);
}

export function getSeriesPaletteOverride(offset = 0): string[] {
  return getExamplePalette(offset);
}

export function getExampleColor(index: number, offset = 0, overridePalette?: string[]): string {
  const palette = overridePalette?.length ? overridePalette : getExamplePalette(offset);

  return palette[index % palette.length]!;
}

export function applyTopItemPalette<TItem extends TopItem>(items: TItem[], offset = 0, overridePalette?: string[]): TItem[] {
  return items.map((item, index) => ({
    ...item,
    itemStyle: {
      ...item.itemStyle,
      color: getExampleColor(index, offset, overridePalette),
    },
  }));
}

export function applyTopRowPalette(data: unknown, type: KmsfChartType, offset = 0, overridePalette?: string[]): unknown {
  if (!Array.isArray(data)) {
    return data;
  }

  if (type === "wordCloud") {
    return data.map((row, index) =>
      Array.isArray(row)
        ? appendTupleMetadata(row, { textStyle: { color: getExampleColor(index, offset, overridePalette) } })
        : row,
    );
  }

  if (!topItemColorTypes.has(type)) {
    return data;
  }

  return data.map((row, index) =>
    Array.isArray(row)
      ? appendTupleMetadata(row, { itemStyle: { color: getExampleColor(index, offset, overridePalette) } })
      : row,
  );
}
