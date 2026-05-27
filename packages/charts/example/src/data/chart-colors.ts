import type { KmsfChartType } from "../../../src";

const examplePalette = [
  "#10b981",
  "#84cc16",
  "#0ea5e9",
  "#f97316",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
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

export function getExamplePalette(offset = 0): string[] {
  if (offset === 0) {
    return [...examplePalette];
  }

  return examplePalette.map((_, index) => examplePalette[(index + offset) % examplePalette.length]!);
}

export function getSeriesPaletteOverride(offset = 0): string[] {
  return getExamplePalette(offset);
}

export function getExampleColor(index: number, offset = 0): string {
  const palette = getExamplePalette(offset);

  return palette[index % palette.length]!;
}

export function applyTopItemPalette<TItem extends TopItem>(items: TItem[], offset = 0): TItem[] {
  return items.map((item, index) => ({
    ...item,
    itemStyle: {
      ...item.itemStyle,
      color: getExampleColor(index, offset),
    },
  }));
}

export function applyTopRowPalette(data: unknown, type: KmsfChartType, offset = 0): unknown {
  if (!Array.isArray(data)) {
    return data;
  }

  if (type === "wordCloud") {
    return data.map((row, index) =>
      Array.isArray(row)
        ? [...row.slice(0, 2), { textStyle: { color: getExampleColor(index, offset) } }]
        : row,
    );
  }

  if (!topItemColorTypes.has(type)) {
    return data;
  }

  return data.map((row, index) =>
    Array.isArray(row)
      ? [...row.slice(0, 2), { itemStyle: { color: getExampleColor(index, offset) } }]
      : row,
  );
}
