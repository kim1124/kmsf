import { describe, expect, it } from "vitest";

import {
  buildLegendOption,
  buildTooltipOption,
  buildTrendDataZoom,
  mergeChartOptions,
  shouldRotateCategoryLabels,
} from "../../src/common/options";
import { buildThemeOption } from "../../src/common/theme";
import { getWordCloudPalette } from "../../src/components/WordCloud/WordCloud";

describe("buildLegendOption", () => {
  it("hides legend when false is provided", () => {
    expect(buildLegendOption(false)).toEqual({ show: false });
  });

  it("uses a visible legend by default", () => {
    expect(buildLegendOption(undefined)).toEqual({ show: true });
  });
});

describe("buildTooltipOption", () => {
  it("keeps tooltip confined by default and allows body append", () => {
    expect(buildTooltipOption(undefined)).toMatchObject({
      appendToBody: true,
      confine: false,
      show: true,
      trigger: "axis",
    });
  });
});

describe("mergeChartOptions", () => {
  it("preserves defaults while applying top-level overrides", () => {
    const result = mergeChartOptions(
      {
        legend: { show: true },
        grid: { containLabel: true },
      },
      {
        legend: { top: 12 },
      },
    );

    expect(result).toMatchObject({
      legend: { show: true, top: 12 },
      grid: { containLabel: true },
    });
  });
});

describe("buildTrendDataZoom", () => {
  it("does not include a visible slider by default", () => {
    expect(buildTrendDataZoom()).toEqual([{ type: "inside" }]);
  });
});

describe("buildThemeOption", () => {
  it("uses KMSF accent as the first light palette color", () => {
    expect(buildThemeOption("light").color).toEqual(expect.arrayContaining(["#10b981"]));
  });

  it("uses KMSF accent as the first dark palette color", () => {
    expect(buildThemeOption("dark").color).toEqual(expect.arrayContaining(["#34d399"]));
  });

  it("allows consumers to override palette, text, and background", () => {
    expect(
      buildThemeOption("light", {
        backgroundColor: "#ffffff",
        palette: ["#2563eb", "#9333ea"],
        textColor: "#0f172a",
      }),
    ).toMatchObject({
      backgroundColor: "#ffffff",
      color: ["#2563eb", "#9333ea"],
      textStyle: { color: "#0f172a" },
    });
  });
});

describe("getWordCloudPalette", () => {
  it("uses theme override palette when provided", () => {
    expect(getWordCloudPalette("light", ["#2563eb", "#9333ea"])).toEqual(["#2563eb", "#9333ea"]);
  });

  it("falls back to KMSF theme palettes", () => {
    expect(getWordCloudPalette("light")).toEqual(expect.arrayContaining(["#10b981"]));
    expect(getWordCloudPalette("dark")).toEqual(expect.arrayContaining(["#34d399"]));
  });
});

describe("shouldRotateCategoryLabels", () => {
  it("does not rotate short labels that fit the sample container", () => {
    expect(shouldRotateCategoryLabels(["A", "B", "C"], 500)).toBe(false);
  });

  it("rotates labels when category text is likely to overflow", () => {
    expect(shouldRotateCategoryLabels(["Long category label", "Another long category label"], 220)).toBe(true);
  });
});
