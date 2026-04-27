import { describe, expect, it } from "vitest";

import {
  GaugeChart,
  GuageChart,
  SunburstChart,
  SunbustChart,
  createTopRows,
  createTrendRows,
} from "../../src";

describe("public component aliases", () => {
  it("keeps misspelled exports while exposing conventional chart names", () => {
    expect(GaugeChart).toBe(GuageChart);
    expect(SunburstChart).toBe(SunbustChart);
  });
});

describe("createTrendRows", () => {
  it("builds TrendChart tuple rows from object input", () => {
    const rows = createTrendRows([
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
    const rows = createTopRows([
      { name: "A", value: 100 },
      { name: "B", values: [200, 20] },
    ]);

    expect(rows).toEqual([
      ["A", 100],
      ["B", 200, 20],
    ]);
  });
});
