import { describe, expect, it } from "vitest";

import * as charts from "../../src";

describe("public component aliases", () => {
  it("exports the generic type-driven chart component", () => {
    expect(charts.GenericChart).toBeTypeOf("function");
  });

  it("exposes conventional chart names without misspelled compatibility exports", () => {
    expect(charts.GaugeChart).toBeTypeOf("function");
    expect(charts.SunburstChart).toBeTypeOf("function");
    expect("GuageChart" in charts).toBe(false);
    expect("SunbustChart" in charts).toBe(false);
  });
});

describe("createTrendRows", () => {
  it("builds TrendChart tuple rows from object input", () => {
    const rows = charts.createTrendRows([
      { x: "2026-04-26 10:00:00", values: [100, 200] },
      { x: "2026-04-26 11:00:00", value: 300 },
    ]);

    expect(rows).toEqual([
      ["2026-04-26 10:00:00", 100, 200],
      ["2026-04-26 11:00:00", 300],
    ]);
  });
});

describe("createTopRows", () => {
  it("builds TopChart tuple rows from object input", () => {
    const rows = charts.createTopRows([
      { name: "A", value: 100 },
      { name: "B", values: [200, 20] },
    ]);

    expect(rows).toEqual([
      ["A", 100],
      ["B", 200, 20],
    ]);
  });
});
