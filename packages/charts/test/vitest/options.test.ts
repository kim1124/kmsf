import { describe, expect, it } from "vitest";

import {
  buildWordCloudTextStyle,
  kmsfTopPalette,
  normalizeHexColors,
  getChartPalette,
} from "../../src/common/colors";
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
    expect(buildLegendOption(undefined)).toEqual({ icon: "circle", show: true });
  });

  it("merges scroll and truncation defaults for visible data legends", () => {
    expect(
      buildLegendOption(true, {
        orient: "vertical",
        right: 8,
        textStyle: { ellipsis: "...", overflow: "truncate", width: 112 },
        type: "scroll",
      }),
    ).toMatchObject({
      orient: "vertical",
      right: 8,
      show: true,
      textStyle: { ellipsis: "...", overflow: "truncate", width: 112 },
      type: "scroll",
    });
  });

  it("keeps explicit false stronger than scroll defaults", () => {
    expect(buildLegendOption(false, { type: "scroll" })).toEqual({ show: false });
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

  it("uses the shared KMSF typography baseline for chart text", () => {
    expect(buildThemeOption("light")).toMatchObject({
      textStyle: {
        fontFamily: expect.stringContaining("Spoqa Han Sans Neo"),
        fontSize: 12,
      },
    });
  });
});

describe("getWordCloudPalette", () => {
  it("uses colors prop before theme override palette", () => {
    expect(getWordCloudPalette(["#111111"], ["#2563eb", "#9333ea"])).toEqual(["#111111"]);
    expect(getWordCloudPalette(undefined, ["#2563eb", "#9333ea"])).toEqual(["#2563eb", "#9333ea"]);
  });

  it("falls back to TOP palette and maps colors by dataIndex", () => {
    const textStyle = buildWordCloudTextStyle(getChartPalette({}));

    expect(getWordCloudPalette()).toEqual(kmsfTopPalette);
    expect(normalizeHexColors(["#123456"])).toEqual(["#123456"]);
    expect(textStyle.color({ dataIndex: 0 })).toBe(kmsfTopPalette[0]);
    expect(textStyle.color({ dataIndex: 1 })).toBe(kmsfTopPalette[1]);
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
