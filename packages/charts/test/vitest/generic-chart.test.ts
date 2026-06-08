import { describe, expect, it } from "vitest";
import type { EChartsOption } from "echarts";

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

  it("uses smooth line series by default in GenericChart runtime", () => {
    const option = buildGenericChartOption({
      data: [["2026-06-08 10:00:00", 10]],
      dataFormat: "trend",
      type: "line",
    });

    expect(option.series).toEqual([expect.objectContaining({ smooth: true, type: "line" })]);
  });

  it("keeps user seriesOptions stronger than runtime line smoothing", () => {
    const option = buildGenericChartOption({
      data: [["2026-06-08 10:00:00", 10]],
      dataFormat: "trend",
      seriesOptions: { smooth: false },
      type: "line",
    });

    expect(option.series).toEqual([expect.objectContaining({ smooth: false })]);
  });

  it("defaults title text and subtext to empty strings", () => {
    const option = buildGenericChartOption({ data: [["A", 10]], dataFormat: "top", type: "bar" });

    expect(option.title).toMatchObject({ subtext: "", text: "" });
  });

  it("reserves grid space when user title is visible", () => {
    const option = buildGenericChartOption({
      data: [["A", 10]],
      dataFormat: "top",
      options: { title: { subtext: "Subtitle", text: "Title" } },
      type: "bar",
    });

    expect(option.grid).toMatchObject({ top: 80 });
    expect(option.title).toMatchObject({ subtext: "Subtitle", text: "Title" });
  });

  it("separates visible title, legend, and chart drawing area for axis charts", () => {
    const option = buildGenericChartOption({
      data: [["2026-06-08 10:00:00", 10]],
      dataFormat: "trend",
      options: { title: { subtext: "Subtitle", text: "Title" } },
      type: "line",
    });

    expect(option.legend).toMatchObject({ show: true, top: 56 });
    expect(option.grid).toMatchObject({ top: 104 });
  });

  it("lets user grid override KMSF title layout defaults", () => {
    const option = buildGenericChartOption({
      data: [["A", 10]],
      dataFormat: "top",
      options: { grid: { top: 12 }, title: { text: "Title" } },
      type: "bar",
    });

    expect(option.grid).toMatchObject({ top: 12 });
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

  it.each(["bar", "pictorialBar", "treemap", "gauge", "sankey", "heatmap", "funnel", "sunburst", "wordCloud"] as const)(
    "defaults legend to hidden for %s",
    (type) => {
      const option =
        type === "heatmap"
          ? buildGenericChartOption({
              data: [[0, 0, 10]],
              dataFormat: "native",
              options: {
                xAxis: { data: ["A"], type: "category" },
                yAxis: { data: ["B"], type: "category" },
              },
              type,
            })
          : buildGenericChartOption({
              data: type === "sankey" ? [{ name: "A" }, { name: "B" }] : [["A", 10], ["B", 8]],
              dataFormat: type === "sankey" ? "native" : "top",
              series: type === "sankey" ? [{ links: [{ source: "A", target: "B", value: 1 }] }] : undefined,
              type,
            });

      expect(option.legend).toMatchObject({ show: false });
    },
  );

  it("defaults pie legend to visible right-side scroll placement", () => {
    const option = buildGenericChartOption({
      data: [["Very long legend label that should not overlap the pie", 10]],
      dataFormat: "top",
      type: "pie",
    });

    expect(option.legend).toMatchObject({
      bottom: 12,
      orient: "vertical",
      right: 8,
      show: true,
      textStyle: { ellipsis: "...", overflow: "truncate" },
      top: 36,
      type: "scroll",
    });
    expect(option.series).toEqual([
      expect.objectContaining({
        center: ["34%", "52%"],
        radius: ["32%", "66%"],
      }),
    ]);
  });

  it("keeps user-provided legend visible for hidden-by-default generic chart types", () => {
    const option = buildGenericChartOption({
      data: [["A", 10]],
      dataFormat: "top",
      legend: { top: 12 },
      type: "bar",
    });

    expect(option.legend).toMatchObject({ show: true, top: 12 });
  });

  it.each(["pie", "funnel", "sunburst", "treemap", "wordCloud"] as const)(
    "uses scroll legend defaults for %s data legends",
    (type) => {
      const option = buildGenericChartOption({
        data: [["Very long legend label that should not overflow", 10]],
        dataFormat: "top",
        legend: true,
        type,
      });

      expect(option.legend).toMatchObject({
        show: true,
        textStyle: { ellipsis: "...", overflow: "truncate" },
        type: "scroll",
      });
    },
  );

  it("places pie data legend on the right and shrinks the pie drawing area when visible", () => {
    const option = buildGenericChartOption({
      data: [["Very long legend label that should not overlap the pie", 10]],
      dataFormat: "top",
      legend: true,
      type: "pie",
    });

    expect(option.legend).toMatchObject({
      bottom: 12,
      orient: "vertical",
      right: 8,
      top: 36,
      type: "scroll",
    });
    expect(option.series).toEqual([
      expect.objectContaining({
        center: ["34%", "52%"],
        radius: ["32%", "66%"],
      }),
    ]);
  });

  it("uses filled circle legend icon for all visible legends", () => {
    const option = buildGenericChartOption({
      data: [["A", 10]],
      dataFormat: "top",
      legend: true,
      type: "funnel",
    });

    expect(option.legend).toMatchObject({ icon: "circle", show: true });
  });

  it("disables label-heavy single-series chart labels by default", () => {
    for (const type of ["pie", "funnel", "sunburst"] as const) {
      const option = buildGenericChartOption({
        data: type === "sunburst" ? [{ name: "A", value: 10 }] : [["A", 10]],
        dataFormat: type === "sunburst" ? "native" : "top",
        type,
      });

      expect(option.series).toEqual([expect.objectContaining({ label: { show: false } })]);
    }
  });

  it("formats single-series TOP tooltip as Item N", () => {
    const option = buildGenericChartOption({
      data: [["Metric 01", 10]],
      dataFormat: "top",
      type: "pie",
    });
    const formatter = (option.tooltip as { formatter?: unknown }).formatter;

    expect(typeof formatter).toBe("function");
    expect((formatter as (params: unknown) => string)({ dataIndex: 0, name: "Metric 01", value: 10 })).toContain(
      "Item 1",
    );
  });

  it("keeps seriesOptions stronger than generic pie legend layout defaults", () => {
    const option = buildGenericChartOption({
      data: [["Very long legend label", 10]],
      dataFormat: "top",
      legend: true,
      seriesOptions: { center: ["50%", "50%"], radius: "70%" },
      type: "pie",
    });

    expect(option.series).toEqual([
      expect.objectContaining({
        center: ["50%", "50%"],
        radius: "70%",
      }),
    ]);
  });

  it("does not apply right-side legend placement to non-pie data legends", () => {
    const option = buildGenericChartOption({
      data: [["Very long legend label", 10]],
      dataFormat: "top",
      legend: true,
      type: "funnel",
    });

    expect(option.legend).toMatchObject({ show: true, type: "scroll" });
    expect(option.legend).not.toMatchObject({ right: 8, orient: "vertical" });
  });

  it("places radar legend above the chart with spacing while preserving provided indicators", () => {
    const option = buildGenericChartOption({
      data: [{ name: "KMSF", value: [80, 90] }],
      dataFormat: "native",
      options: {
        radar: {
          indicator: [
            { max: 100, name: "UX" },
            { max: 100, name: "API" },
          ],
        },
      },
      type: "radar",
    });

    expect(option.legend).toMatchObject({ show: true, top: 8 });
    expect(option.radar).toMatchObject({
      alignTicks: false,
      center: ["50%", "62%"],
      indicator: [
        { alignTicks: false, max: 100, name: "UX" },
        { alignTicks: false, max: 100, name: "API" },
      ],
      radius: "46%",
    });
  });

  it("preserves explicit radar alignTicks values", () => {
    const options = {
      radar: {
        indicator: [
          { alignTicks: true, max: 100, name: "UX" },
          { max: 100, name: "API" },
        ],
      },
    } as unknown as EChartsOption;
    const option = buildGenericChartOption({
      data: [{ name: "KMSF", value: [80, 90] }],
      dataFormat: "native",
      options,
      type: "radar",
    });

    expect(option.radar).toMatchObject({
      alignTicks: false,
      indicator: [
        { alignTicks: true, max: 100, name: "UX" },
        { alignTicks: false, max: 100, name: "API" },
      ],
    });
  });

  it.each(["gauge", "funnel", "sankey", "tree", "treemap", "sunburst", "graph", "parallel", "themeRiver", "wordCloud"] as const)(
    "applies non-grid safe layout defaults for visible title and legend on %s",
    (type) => {
      const baseInput =
        type === "sankey"
          ? {
              data: [{ name: "A" }, { name: "B" }],
              series: [{ links: [{ source: "A", target: "B", value: 1 }] }],
            }
          : type === "themeRiver"
            ? { data: [["2026/06/08", 10, "A"]] }
            : type === "parallel"
              ? { data: [[1, 2, 3]] }
              : type === "graph"
                ? { data: [{ name: "A" }], series: [{ links: [] }] }
                : { data: [["A", 10]] };
      const option = buildGenericChartOption({
        ...baseInput,
        dataFormat: type === "gauge" || type === "funnel" || type === "treemap" || type === "wordCloud" ? "top" : "native",
        legend: true,
        options: { title: { text: "Title" } },
        type,
      });
      const series = Array.isArray(option.series) ? option.series[0] : option.series;

      expect(option.legend).toMatchObject({ show: true });
      expect(JSON.stringify({ option, series }), type).toMatch(/top|center|radius|height|layout/);
    },
  );

  it("allocates a larger protected top region for parallel charts with visible legends", () => {
    const legendOnly = buildGenericChartOption({
      data: [[1, 2, 3]],
      dataFormat: "native",
      legend: true,
      options: {
        parallelAxis: [
          { dim: 0, name: "Speed" },
          { dim: 1, name: "Cost" },
          { dim: 2, name: "Score" },
        ],
      },
      type: "parallel",
    });
    const titleAndLegend = buildGenericChartOption({
      data: [[1, 2, 3]],
      dataFormat: "native",
      legend: true,
      options: {
        parallelAxis: [
          { dim: 0, name: "Speed" },
          { dim: 1, name: "Cost" },
          { dim: 2, name: "Score" },
        ],
        title: { subtext: "Sub title", text: "Title" },
      },
      type: "parallel",
    });

    expect(legendOnly.parallel).toMatchObject({ top: 64 });
    expect(titleAndLegend.parallel).toMatchObject({ top: 96 });
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
