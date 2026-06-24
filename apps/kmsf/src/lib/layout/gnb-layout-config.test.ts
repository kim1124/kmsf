import { describe, expect, it } from "vitest";

import {
  DEFAULT_GNB_REGIONS,
  hasGnbRegion,
  normalizeGnbLayoutConfig,
  normalizeGnbRegions,
} from "./gnb-layout-config";

describe("normalizeGnbRegions", () => {
  it("falls back to top and left when the value is missing", () => {
    expect(normalizeGnbRegions(undefined)).toEqual(DEFAULT_GNB_REGIONS);
  });

  it("keeps an explicitly empty region list", () => {
    expect(normalizeGnbRegions([])).toEqual([]);
  });

  it("keeps valid regions in canonical order and removes duplicates", () => {
    expect(normalizeGnbRegions(["footer", "top", "right", "top", "invalid"])).toEqual([
      "top",
      "right",
      "footer",
    ]);
  });
});

describe("normalizeGnbLayoutConfig", () => {
  it("normalizes the enabled region list", () => {
    expect(normalizeGnbLayoutConfig({ enabledRegions: ["right"] })).toEqual({
      enabledRegions: ["right"],
    });
  });

  it("supports region checks", () => {
    const config = normalizeGnbLayoutConfig({ enabledRegions: ["top", "footer"] });

    expect(hasGnbRegion(config, "top")).toBe(true);
    expect(hasGnbRegion(config, "left")).toBe(false);
  });
});
