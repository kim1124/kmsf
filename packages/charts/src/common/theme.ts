import type { EChartsOption } from "echarts";

export const kmsfLightPalette = ["#14b8a6", "#84cc16", "#0ea5e9", "#f97316", "#8b5cf6", "#ef4444"];
export const kmsfDarkPalette = ["#2dd4bf", "#a3e635", "#38bdf8", "#fb923c", "#a78bfa", "#f87171"];

export function buildThemeOption(theme: string | undefined): EChartsOption {
  const isDark = theme === "dark";

  return {
    backgroundColor: "transparent",
    color: isDark ? kmsfDarkPalette : kmsfLightPalette,
    textStyle: {
      color: isDark ? "#e5e7eb" : "#111827",
    },
  };
}
