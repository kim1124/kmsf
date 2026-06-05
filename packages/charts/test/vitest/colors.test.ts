import { describe, expect, it, vi } from "vitest";

import {
  applyItemPalette,
  applySeriesPalette,
  buildWordCloudTextStyle,
  getChartPalette,
  kmsfTopPalette,
  normalizeHexColors,
} from "../../src/common/colors";

describe("chart colors", () => {
  it("resolves colors prop before theme palette and TOP fallback", () => {
    expect(getChartPalette({ colors: ["#111111"], themePalette: ["#222222"] })).toEqual(["#111111"]);
    expect(getChartPalette({ themePalette: ["#222222"] })).toEqual(["#222222"]);
    expect(getChartPalette({})).toEqual(kmsfTopPalette);
  });

  it("warns and removes invalid hex colors", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(normalizeHexColors(["#123abc", "red", "#fff"])).toEqual(["#123abc", "#fff"]);
    expect(warn).toHaveBeenCalledWith("[KMSF Charts]", "Invalid color value ignored: red");

    warn.mockRestore();
  });

  it("maps item, series, and wordCloud colors by index", () => {
    expect(applyItemPalette([{ name: "A", value: 1 }, { name: "B", value: 2 }], ["#111111", "#222222"]))
      .toMatchObject([
        { itemStyle: { color: "#111111" } },
        { itemStyle: { color: "#222222" } },
      ]);
    expect(applySeriesPalette([{ name: "S1" }, { name: "S2" }], ["#111111", "#222222"]))
      .toMatchObject([
        { itemStyle: { color: "#111111" } },
        { itemStyle: { color: "#222222" } },
      ]);
    expect(buildWordCloudTextStyle(["#111111", "#222222"]).color({ dataIndex: 2 })).toBe("#111111");
  });
});
