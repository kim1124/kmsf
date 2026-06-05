import type { EChartsOption } from "echarts";
import type { ReactNode } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const captured = vi.hoisted(() => ({
  props: [] as Array<{ loadingFallback?: ReactNode; option: EChartsOption }>,
}));

vi.mock("../../src/common/KmsfChart", () => ({
  KmsfChart: (props: { loadingFallback?: ReactNode; option: EChartsOption }) => {
    captured.props.push(props);
    return null;
  },
}));

import { GenericChart } from "../../src/components/GenericChart";
import { GaugeChart } from "../../src/components/GaugeChart";
import { TopChart } from "../../src/components/TopChart";
import { TrendChart } from "../../src/components/TrendChart";
import { WordCloud } from "../../src/components/WordCloud";

beforeEach(() => {
  captured.props = [];
});

function fallback() {
  return createElement("div", { "data-testid": "chart-loading-fallback" }, "차트 로딩 중");
}

describe("chart loading fallback", () => {
  it("forwards loadingFallback to GenericChart and direct chart components", () => {
    const loadingFallback = fallback();

    renderToStaticMarkup(createElement(GenericChart, {
      data: [["2026-06-05 10:00:00", 10]],
      dataFormat: "trend",
      loadingFallback,
      type: "line",
    }));
    renderToStaticMarkup(createElement(TopChart, { data: [["Alpha", 10]], loadingFallback }));
    renderToStaticMarkup(createElement(TrendChart, {
      data: [["2026-06-05 10:00:00", 10]],
      loadingFallback,
      series: [{ name: "A" }],
    }));
    renderToStaticMarkup(createElement(GaugeChart, { data: 72, loadingFallback }));

    expect(captured.props).toHaveLength(4);
    expect(captured.props.every((props) => props.loadingFallback === loadingFallback)).toBe(true);
  });

  it("renders loadingFallback while wordCloud extension is pending", () => {
    const loadingFallback = fallback();
    const genericMarkup = renderToStaticMarkup(createElement(GenericChart, {
      data: [["Alpha", 10]],
      dataFormat: "top",
      loadingFallback,
      type: "wordCloud",
    }));
    const dedicatedMarkup = renderToStaticMarkup(createElement(WordCloud, {
      data: [{ name: "Alpha", value: 10 }],
      loadingFallback,
    }));

    expect(genericMarkup).toContain("차트 로딩 중");
    expect(dedicatedMarkup).toContain("차트 로딩 중");
    expect(captured.props).toHaveLength(0);
  });
});
