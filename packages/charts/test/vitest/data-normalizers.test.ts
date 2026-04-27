import { describe, expect, it } from "vitest";

import {
  buildTopSeries,
  buildTrendSeries,
  normalizeTopRows,
  normalizeTrendRows,
} from "../../src/common/data-normalizers";

describe("normalizeTrendRows", () => {
  it("maps the first tuple item to x values and remaining items to series values", () => {
    const date = new Date(2026, 3, 25, 11, 0, 0);

    const result = normalizeTrendRows([
      ["2026-04-25 10:00:00", 1000, 1500],
      [date, 2000, null],
    ]);

    expect(result.xAxisData).toEqual(["2026-04-25 10:00:00", "2026-04-25 11:00:00"]);
    expect(result.seriesValues).toEqual([
      [1000, 2000],
      [1500, null],
    ]);
  });
});

describe("normalizeTopRows", () => {
  it("maps categories and values by series order", () => {
    const result = normalizeTopRows([
      ["A", 100, 10],
      ["B", 200, 20],
    ]);

    expect(result.categories).toEqual(["A", "B"]);
    expect(result.seriesValues).toEqual([
      [100, 200],
      [10, 20],
    ]);
  });
});

describe("buildTrendSeries", () => {
  it("creates area series when the trend mode is area", () => {
    const result = buildTrendSeries({
      mode: "area",
      series: [{ id: "sales", name: "Sales" }],
      valuesBySeries: [[100, 200]],
    });

    expect(result).toMatchObject([
      {
        id: "sales",
        name: "Sales",
        type: "line",
        areaStyle: {},
        data: [100, 200],
      },
    ]);
  });

  it("disables series update animation for realtime trend replacement", () => {
    const result = buildTrendSeries({
      mode: "line",
      series: [{ id: "realtime", name: "Realtime" }],
      valuesBySeries: [[100, 200, 300]],
    });

    expect(result).toMatchObject([
      {
        animation: false,
        animationDurationUpdate: 0,
        animationEasingUpdate: "linear",
      },
    ]);
  });
});

describe("buildTopSeries", () => {
  it("creates a default pie series when user series is omitted", () => {
    const result = buildTopSeries({
      categories: ["A", "B"],
      mode: "pie",
      series: undefined,
      valuesBySeries: [[100, 200]],
    });

    expect(result).toMatchObject([
      {
        name: "Series 1",
        type: "pie",
        data: [
          { name: "A", value: 100 },
          { name: "B", value: 200 },
        ],
      },
    ]);
  });
});
