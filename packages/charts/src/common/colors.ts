import type { SeriesOption } from "echarts";

export const kmsfTopPalette = [
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

  return colors.filter((color) => hexColorPattern.test(color));
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
