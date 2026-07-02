import { describe, expect, it } from "vitest";

import { getKmsfChartSetOptionOptions } from "../../src/common/KmsfChart";

describe("KmsfChart update options", () => {
  it("uses replaceMerge when previous and next options are not available", () => {
    expect(getKmsfChartSetOptionOptions()).toMatchObject({
      lazyUpdate: true,
      replaceMerge: ["series"],
    });
  });

  it("keeps same-shape updates mergeable so ECharts can animate data changes", () => {
    expect(
      getKmsfChartSetOptionOptions(
        {
          series: [
            { data: [1, 2, 3], id: "revenue", type: "line" },
            { data: [2, 3, 4], id: "cost", type: "line" },
          ],
        },
        {
          series: [
            { data: [2, 3, 4], id: "revenue", type: "line" },
            { data: [3, 4, 5], id: "cost", type: "line" },
          ],
        },
      ),
    ).toEqual({
      lazyUpdate: true,
    });
  });

  it("replaces stale series when the next option has fewer series", () => {
    expect(
      getKmsfChartSetOptionOptions(
        {
          series: [
            { data: [1, 2, 3], id: "revenue", type: "line" },
            { data: [2, 3, 4], id: "cost", type: "line" },
          ],
        },
        {
          series: [{ data: [2, 3, 4], id: "revenue", type: "line" }],
        },
      ),
    ).toMatchObject({
      lazyUpdate: true,
      replaceMerge: ["series"],
    });
  });
});
