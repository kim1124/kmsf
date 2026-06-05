import { describe, expect, it } from "vitest";

import {
  buildGenericChartOption,
  resolveGenericDataFormat,
  supportedGenericChartTypes,
} from "../../src/common/generic-chart";

describe("supportedGenericChartTypes", () => {
  it("lists the ECharts built-in series types and package extension type", () => {
    expect(supportedGenericChartTypes).toEqual(
      expect.arrayContaining([
        "bar",
        "line",
        "pie",
        "scatter",
        "effectScatter",
        "candlestick",
        "radar",
        "heatmap",
        "tree",
        "treemap",
        "sunburst",
        "map",
        "lines",
        "graph",
        "boxplot",
        "parallel",
        "gauge",
        "funnel",
        "sankey",
        "themeRiver",
        "pictorialBar",
        "custom",
        "wordCloud",
      ]),
    );
  });
});

describe("resolveGenericDataFormat", () => {
  it("prefers top format for category-value bar data", () => {
    expect(resolveGenericDataFormat("bar", "auto", [["Alpha", 100]])).toBe("top");
  });

  it("prefers trend format for time-value line data", () => {
    expect(resolveGenericDataFormat("line", "auto", [["2026-05-26 10:00:00", 100]])).toBe("trend");
  });

  it("keeps structural charts on native format by default", () => {
    expect(resolveGenericDataFormat("sankey", "auto", [{ name: "Visit" }])).toBe("native");
  });
});

describe("buildGenericChartOption", () => {
  it("builds a top pie series from [name, value] rows", () => {
    const option = buildGenericChartOption({
      data: [["Alpha", 100]],
      type: "pie",
    });

    expect(option.series).toMatchObject([
      {
        type: "pie",
        data: [{ name: "Alpha", value: 100 }],
      },
    ]);
  });

  it("builds trend line axes and series from [[time, value]] rows", () => {
    const option = buildGenericChartOption({
      data: [["2026-05-26 10:00:00", 100]],
      type: "line",
    });

    expect(option.xAxis).toMatchObject({ data: ["2026-05-26 10:00:00"], type: "category" });
    expect(option.yAxis).toMatchObject({ type: "value" });
    expect(option.series).toMatchObject([
      {
        type: "line",
        data: [100],
      },
    ]);
  });

  it("applies seriesOptions before final options override", () => {
    const option = buildGenericChartOption({
      data: [["Alpha", 100]],
      options: {
        series: [{ name: "Final", type: "bar", data: [300] }],
      },
      seriesOptions: {
        itemStyle: { color: "#2563eb" },
      },
      type: "bar",
    });

    expect(option.series).toEqual([{ name: "Final", type: "bar", data: [300] }]);
  });

  it("keeps native structural chart data in the generated series", () => {
    const option = buildGenericChartOption({
      data: [{ name: "Visit" }, { name: "Signup" }],
      series: [{ links: [{ source: "Visit", target: "Signup", value: 10 }] }],
      type: "sankey",
    });

    expect(option.series).toMatchObject([
      {
        type: "sankey",
        data: [{ name: "Visit" }, { name: "Signup" }],
        links: [{ source: "Visit", target: "Signup", value: 10 }],
      },
    ]);
  });

  it("sets an explicit base zlevel for lines to avoid undefined zrender layers", () => {
    const option = buildGenericChartOption({
      data: [{ coords: [[0, 0], [1, 1]] }],
      options: {
        xAxis: { type: "value" },
        yAxis: { type: "value" },
      },
      seriesOptions: { coordinateSystem: "cartesian2d" },
      type: "lines",
    });

    expect(option.series).toMatchObject([
      {
        coordinateSystem: "cartesian2d",
        type: "lines",
        zlevel: 0,
      },
    ]);
  });
});
