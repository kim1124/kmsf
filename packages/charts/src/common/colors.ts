import type { SeriesOption } from "echarts";

export const kmsfTopPalette = [
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

export const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getPaletteColor(palette: readonly string[], index: number): string {
  return palette[index % palette.length] ?? kmsfTopPalette[0];
}

export function normalizeHexColors(colors?: string[]): string[] {
  if (!colors?.length) {
    return [];
  }

  return colors.filter((color) => {
    const valid = hexColorPattern.test(color);

    if (!valid) {
      console.warn("[KMSF Charts]", `Invalid color value ignored: ${color}`);
    }

    return valid;
  });
}

export function getChartPalette(input: { colors?: string[]; themePalette?: string[] }): string[] {
  const colors = normalizeHexColors(input.colors);

  if (colors.length > 0) {
    return colors;
  }

  if (input.themePalette?.length) {
    return input.themePalette;
  }

  return [...kmsfTopPalette];
}

export function applySeriesPalette(series: SeriesOption[], palette: readonly string[]): SeriesOption[] {
  return series.map((item, index) => {
    const source = item as SeriesOption & { itemStyle?: PlainObject };

    return {
      ...item,
      itemStyle: {
        ...source.itemStyle,
        color: getPaletteColor(palette, index),
      },
    } as SeriesOption;
  });
}

export function applyItemPalette<TItem>(data: TItem[], palette: readonly string[]): TItem[] {
  return data.map((item, index) => {
    if (!isPlainObject(item)) {
      return item;
    }

    return {
      ...item,
      itemStyle: {
        ...(isPlainObject(item.itemStyle) ? item.itemStyle : {}),
        color: getPaletteColor(palette, index),
      },
    } as TItem;
  });
}

export function buildWordCloudTextStyle(palette: readonly string[]) {
  return {
    color: (params: { dataIndex?: number }) => getPaletteColor(palette, params.dataIndex ?? 0),
  };
}
