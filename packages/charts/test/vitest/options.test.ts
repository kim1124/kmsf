import { describe, expect, it } from "vitest";

import {
  buildLegendOption,
  buildTooltipOption,
  buildTrendDataZoom,
  mergeChartOptions,
  shouldRotateCategoryLabels,
} from "../../src/common/options";

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

describe("shouldRotateCategoryLabels", () => {
  it("does not rotate short labels that fit the sample container", () => {
    expect(shouldRotateCategoryLabels(["A", "B", "C"], 500)).toBe(false);
  });

  it("rotates labels when category text is likely to overflow", () => {
    expect(shouldRotateCategoryLabels(["Long category label", "Another long category label"], 220)).toBe(true);
  });
});
