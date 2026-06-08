import { describe, expect, it } from "vitest";

import { getKmsfChartSetOptionOptions } from "../../src/common/KmsfChart";

describe("KmsfChart update options", () => {
  it("replaces stale series when the next option has fewer series", () => {
    expect(getKmsfChartSetOptionOptions()).toMatchObject({
      lazyUpdate: true,
      replaceMerge: ["series"],
    });
  });
});
