import type { EChartsOption, SeriesOption } from "echarts";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const captured = vi.hoisted(() => ({
  options: [] as EChartsOption[],
}));

vi.mock("../../src/common/KmsfChart", () => ({
  KmsfChart: (props: { option: EChartsOption }) => {
    captured.options.push(props.option);
    return null;
  },
}));

import { GaugeChart } from "../../src/components/GaugeChart";
import { HeatmapChart } from "../../src/components/HeatmapChart";
import { SankeyChart } from "../../src/components/SankeyChart";
import { SunburstChart } from "../../src/components/SunburstChart";
import { TopChart } from "../../src/components/TopChart";
import { TrendChart } from "../../src/components/TrendChart";

beforeEach(() => {
  captured.options = [];
});

function renderOption(element: ReturnType<typeof createElement>): EChartsOption {
  captured.options = [];
  renderToStaticMarkup(element);

  const option = captured.options.at(-1);

  if (!option) {
    throw new Error("KmsfChart option was not captured.");
  }

  return option;
}

function getSeries(option: EChartsOption): SeriesOption[] {
  return (Array.isArray(option.series) ? option.series : [option.series]).filter(Boolean) as SeriesOption[];
}

describe("dedicated chart colors", () => {
  it("applies colors prop to trend chart series", () => {
    const option = renderOption(
      createElement(TrendChart, {
        colors: ["#111111", "#222222"],
        data: [["2026-06-02 10:00:00", 10, 20]],
        series: [{ name: "A" }, { name: "B" }],
      }),
    );

    expect(getSeries(option)).toMatchObject([
      { itemStyle: { color: "#111111" } },
      { itemStyle: { color: "#222222" } },
    ]);
  });

  it("applies colors prop to top chart items", () => {
    const option = renderOption(
      createElement(TopChart, {
        colors: ["#111111", "#222222"],
        data: [
          ["Alpha", 10],
          ["Beta", 20],
        ],
      }),
    );

    expect(getSeries(option)[0]).toMatchObject({
      data: [
        { itemStyle: { color: "#111111" } },
        { itemStyle: { color: "#222222" } },
      ],
    });
  });

  it("applies colors prop to gauge and sunburst series", () => {
    const gaugeOption = renderOption(createElement(GaugeChart, { colors: ["#111111"], data: 70 }));
    const sunburstOption = renderOption(
      createElement(SunburstChart, {
        colors: ["#222222"],
        data: [{ name: "Root", value: 1 }],
      }),
    );

    expect(getSeries(gaugeOption)[0]).toMatchObject({ itemStyle: { color: "#111111" } });
    expect(getSeries(sunburstOption)[0]).toMatchObject({ itemStyle: { color: "#222222" } });
  });
});

describe("dedicated chart validation", () => {
  it("renders a local fallback when required data or trend series are missing", () => {
    const topMarkup = renderToStaticMarkup(createElement(TopChart, {} as never));
    const trendMarkup = renderToStaticMarkup(
      createElement(TrendChart, {
        data: [["2026-06-02 10:00:00", 10]],
      } as never),
    );

    expect(topMarkup).toContain("TopChart requires data.");
    expect(trendMarkup).toContain("TrendChart requires series.");
    expect(captured.options).toHaveLength(0);
  });

  it("renders a local fallback when sankey links are missing", () => {
    const markup = renderToStaticMarkup(createElement(SankeyChart, { data: [{ name: "Visit" }], series: [{}] }));

    expect(markup).toContain("Sankey requires series links.");
    expect(captured.options).toHaveLength(0);
  });

  it("renders a local fallback when heatmap axis data props are missing", () => {
    const markup = renderToStaticMarkup(
      createElement(HeatmapChart, {
        data: [[0, 0, 42]],
        xAxisData: undefined,
        yAxisData: ["A"],
      } as never),
    );

    expect(markup).toContain("HeatmapChart requires xAxisData and yAxisData.");
    expect(captured.options).toHaveLength(0);
  });
});
