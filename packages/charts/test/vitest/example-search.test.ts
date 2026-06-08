import { describe, expect, test } from "vitest";

import { buildChartPath, chartSearchItems, searchCharts } from "../../example/src/data/chart-search";

describe("chart global search index", () => {
  test("indexes chart options, examples, and docs without rendering chart components", () => {
    expect(searchCharts("options.radar.indicator").some((item) => item.type === "radar" && item.kind === "chart-option")).toBe(true);
    expect(searchCharts("visualMap").some((item) => item.type === "heatmap")).toBe(true);
    expect(searchCharts("실시간 갱신").some((item) => item.type === "line" && item.kind === "chart-example")).toBe(true);
    expect(searchCharts("평행좌표").some((item) => item.type === "parallel" && item.kind === "chart-doc")).toBe(true);
    expect(chartSearchItems.every((item) => item.keywords.length > 0)).toBe(true);
  });

  test("builds hash-router compatible target paths", () => {
    expect(buildChartPath({ type: "line" })).toBe("/charts/line");
    expect(buildChartPath({ type: "radar", exampleId: "radar-live-update" })).toBe("/charts/radar/examples/radar-live-update");
  });

  test("returns stable limited results by priority", () => {
    const results = searchCharts("options");

    expect(results.length).toBeLessThanOrEqual(10);
    expect(results[0]).toMatchObject({ kind: "chart-option", type: expect.any(String), title: expect.any(String) });
  });

  test("excludes chart types that do not have implemented examples", () => {
    expect(chartSearchItems.some((item) => item.type === "map" || item.type === "custom")).toBe(false);
  });
});
