import type { EChartsOption } from "echarts";
import type { KmsfChartThemeOverrides } from "./types";

export const kmsfLightPalette = ["#10b981", "#84cc16", "#0ea5e9", "#f97316", "#8b5cf6", "#ef4444"];
export const kmsfDarkPalette = ["#34d399", "#a3e635", "#38bdf8", "#fb923c", "#a78bfa", "#f87171"];
export const kmsfFontFamily = [
  "\"Spoqa Han Sans Neo\"",
  "\"SpoqaHanSans\"",
  "system-ui",
  "-apple-system",
  "\"Apple SD Gothic Neo\"",
  "\"Noto Sans KR\"",
  "\"Malgun Gothic\"",
  "sans-serif",
].join(", ");
export const kmsfFontSize = 12;

export function buildThemeOption(
  theme: string | undefined,
  overrides: KmsfChartThemeOverrides = {},
): EChartsOption {
  const isDark = theme === "dark";

  return {
    backgroundColor: overrides.backgroundColor ?? "transparent",
    color: overrides.palette ?? (isDark ? kmsfDarkPalette : kmsfLightPalette),
    textStyle: {
      color: overrides.textColor ?? (isDark ? "#e5e7eb" : "#111827"),
      fontFamily: overrides.fontFamily ?? kmsfFontFamily,
      fontSize: overrides.fontSize ?? kmsfFontSize,
    },
  };
}
