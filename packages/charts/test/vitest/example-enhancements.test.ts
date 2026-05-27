import { describe, expect, it } from "vitest";

import {
  applyTopItemPalette,
  getExamplePalette,
  getSeriesPaletteOverride,
} from "../../example/src/data/chart-colors";
import {
  parseEditableChartData,
  parseEditableOptions,
} from "../../example/src/data/live-editing";
import { buildGenericChartOption } from "../../src/common/generic-chart";

describe("example chart colors", () => {
  it("uses a deterministic 10 color KMSF palette", () => {
    expect(getExamplePalette()).toEqual([
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
    ]);
  });

  it("maps TOP items by data index and wraps after the 10th color", () => {
    const items = Array.from({ length: 12 }, (_, index) => ({ name: `Item ${index + 1}`, value: index + 1 }));
    const coloredItems = applyTopItemPalette(items);

    expect(coloredItems[0]).toMatchObject({ itemStyle: { color: "#10b981" } });
    expect(coloredItems[9]).toMatchObject({ itemStyle: { color: "#f59e0b" } });
    expect(coloredItems[10]).toMatchObject({ itemStyle: { color: "#10b981" } });
  });

  it("returns the same palette for series-level theme overrides", () => {
    expect(getSeriesPaletteOverride()).toEqual(getExamplePalette());
  });
});

describe("example live editing", () => {
  it("accepts safe ECharts option patches", () => {
    expect(parseEditableOptions('{"grid":{"top":48},"tooltip":{"trigger":"item"}}')).toEqual({
      ok: true,
      value: {
        grid: { top: 48 },
        tooltip: { trigger: "item" },
      },
    });
  });

  it("rejects unsupported option keys before ECharts receives them", () => {
    expect(parseEditableOptions('{"notAllowed":true}')).toEqual({
      error: "허용되지 않는 옵션입니다.",
      ok: false,
    });
  });

  it("validates top and trend tuple data shapes", () => {
    expect(parseEditableChartData("[[\"Alpha\",100]]", "top")).toEqual({
      ok: true,
      value: [["Alpha", 100]],
    });
    expect(parseEditableChartData("[[\"2026-05-27 10:00:00\",100]]", "trend")).toEqual({
      ok: true,
      value: [["2026-05-27 10:00:00", 100]],
    });
    expect(parseEditableChartData("[{\"name\":\"Alpha\"}]", "top")).toEqual({
      error: "허용되지 않는 데이터입니다.",
      ok: false,
    });
  });
});

describe("generic tooltip defaults", () => {
  it("uses item trigger for structural item charts", () => {
    const option = buildGenericChartOption({
      data: [{ name: "Visit" }, { name: "Signup" }],
      series: [{ links: [{ source: "Visit", target: "Signup", value: 10 }] }],
      tooltip: true,
      type: "sankey",
    });

    expect(option.tooltip).toMatchObject({ show: true, trigger: "item" });
  });

  it("keeps axis trigger for trend charts", () => {
    const option = buildGenericChartOption({
      data: [["2026-05-27 10:00:00", 100]],
      tooltip: true,
      type: "line",
    });

    expect(option.tooltip).toMatchObject({ show: true, trigger: "axis" });
  });

  it("uses filled circle legend icons for generic trend line charts", () => {
    const option = buildGenericChartOption({
      data: [["2026-05-27 10:00:00", 100]],
      type: "line",
    });

    expect(option.legend).toMatchObject({ icon: "circle", show: true });
  });
});
