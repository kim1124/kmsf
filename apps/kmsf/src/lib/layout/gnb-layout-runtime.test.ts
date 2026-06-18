import { describe, expect, it } from "vitest";

import {
  getGnbLayoutStorageKey,
  normalizeRuntimeGnbLayoutConfig,
  normalizeRuntimeGnbRegions,
  parseStoredRuntimeGnbLayoutConfig,
  serializeRuntimeGnbLayoutConfig,
} from "./gnb-layout-runtime";

describe("runtime GNB layout", () => {
  it("keeps the left side required for runtime settings", () => {
    expect(normalizeRuntimeGnbRegions(["top", "footer"])).toEqual([
      "top",
      "left",
      "footer",
    ]);
    expect(normalizeRuntimeGnbRegions(["right"])).toEqual(["left", "right"]);
  });

  it("uses a username-scoped local storage key", () => {
    expect(getGnbLayoutStorageKey("admin")).toBe("kmsf:gnb-layout:admin");
    expect(getGnbLayoutStorageKey("kim 1124")).toBe("kmsf:gnb-layout:kim%201124");
  });

  it("parses and serializes versioned runtime layout settings", () => {
    const serialized = serializeRuntimeGnbLayoutConfig({
      enabledRegions: ["right", "footer"],
    });

    expect(parseStoredRuntimeGnbLayoutConfig(serialized)).toEqual({
      enabledRegions: ["left", "right", "footer"],
      version: 1,
    });
  });

  it("falls back when stored runtime layout is invalid", () => {
    expect(parseStoredRuntimeGnbLayoutConfig("{", { enabledRegions: ["right"] })).toBeNull();
    expect(
      normalizeRuntimeGnbLayoutConfig(null, { enabledRegions: ["right"] }).enabledRegions,
    ).toEqual(["left", "right"]);
  });
});
