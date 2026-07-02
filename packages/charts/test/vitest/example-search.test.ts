import { describe, expect, test } from "vitest";

import { buildChartPath, chartSearchItems, searchCharts } from "../../example/src/data/chart-search";

describe("chart global search index", () => {
  test("indexes chart options, examples, and docs without rendering chart components", () => {
    expect(searchCharts("options.radar.indicator").some((item) => item.type === "radar" && item.kind === "chart-option")).toBe(true);
    expect(searchCharts("visualMap").some((item) => item.type === "heatmap")).toBe(true);
    expect(searchCharts("seriesOptions").some((item) => item.kind === "chart-api" && item.path?.startsWith("/api/props#"))).toBe(true);
    expect(
      searchCharts("visualMap").some(
        (item) => item.type === "heatmap" && item.kind === "chart-api" && item.path === "/api/props#api-native-required-options",
      ),
    ).toBe(true);
    expect(searchCharts("실시간 갱신").some((item) => item.type === "line" && item.kind === "chart-example")).toBe(true);
    expect(searchCharts("평행좌표").some((item) => item.type === "parallel" && item.kind === "chart-doc")).toBe(true);
    expect(chartSearchItems.every((item) => item.keywords.length > 0)).toBe(true);
  });

  test("builds docs playground target paths", () => {
    expect(buildChartPath({ type: "line" })).toBe("/examples/line");
    expect(buildChartPath({ type: "radar", exampleId: "radar-live-update" })).toBe("/examples/radar#radar-live-update");
    expect(buildChartPath({ path: "/api/props#api-native-required-options", type: "heatmap" })).toBe(
      "/api/props#api-native-required-options",
    );
  });

  test("returns stable limited results by priority", () => {
    const results = searchCharts("options");

    expect(results.length).toBeLessThanOrEqual(10);
    expect(results[0]).toMatchObject({ type: expect.any(String), title: expect.any(String) });
    expect(["chart-api", "chart-option"]).toContain(results[0]?.kind);
  });

  test("excludes chart types that do not have implemented examples", () => {
    expect(chartSearchItems.some((item) => item.type === "map" || item.type === "custom")).toBe(false);
  });
});
