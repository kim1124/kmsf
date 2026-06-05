import { describe, expect, it, vi } from "vitest";

import { logChartIssuesOnce, validateChartConfig } from "../../src/common/validation";

describe("validateChartConfig", () => {
  it("requires data and component-required series before rendering", () => {
    expect(validateChartConfig({ data: undefined, label: "GenericChart", type: "line" })).toMatchObject({
      issues: [{ code: "chart.data.required", level: "error", message: "GenericChart requires data." }],
      valid: false,
    });
    expect(validateChartConfig({ data: [], label: "TrendChart", requireSeries: true, type: "line" })).toMatchObject({
      issues: [{ code: "chart.series.required", level: "error", message: "TrendChart requires series." }],
      valid: false,
    });
  });

  it("requires radar indicator, sankey links, and custom renderItem", () => {
    expect(validateChartConfig({ data: [{ name: "A", value: [1] }], type: "radar" })).toMatchObject({
      issues: [{ code: "radar.indicator.required", level: "error" }],
      valid: false,
    });
    expect(validateChartConfig({ data: [{ name: "Visit" }], series: [{}], type: "sankey" })).toMatchObject({
      issues: [{ code: "sankey.links.required", level: "error" }],
      valid: false,
    });
    expect(validateChartConfig({ data: [], series: [{}], type: "custom" })).toMatchObject({
      issues: [{ code: "custom.renderItem.required", level: "error" }],
      valid: false,
    });
  });

  it("logs identical issues once with KMSF prefix", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const issue = {
      code: "sankey.links.required",
      level: "error" as const,
      message: "Sankey requires series links.",
      missingPath: "series[].links",
      type: "sankey" as const,
    };

    logChartIssuesOnce([issue]);
    logChartIssuesOnce([issue]);

    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("[KMSF Charts]", "Sankey requires series links.");
    error.mockRestore();
  });
});
