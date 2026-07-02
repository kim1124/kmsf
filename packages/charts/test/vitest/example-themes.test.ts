import { describe, expect, it } from "vitest";

import { chartThemeOptions, getChartThemeOption } from "../../example/src/data/chart-themes";

describe("example chart themes", () => {
  it("provides data-table aligned theme presets with palettes", () => {
    expect(chartThemeOptions.map((theme) => theme.value)).toEqual(["basic", "dark", "skyblue", "mint", "gray", "orange"]);

    for (const theme of chartThemeOptions) {
      expect(theme.label.length).toBeGreaterThan(0);
      expect(theme.palette.length).toBeGreaterThan(0);
      expect(theme.palette.every((color) => /^#[0-9a-f]{6}$/i.test(color))).toBe(true);
    }

    expect(getChartThemeOption("mint").palette.slice(0, 4)).toEqual(["#064e3b", "#047857", "#059669", "#10b981"]);
  });
});
