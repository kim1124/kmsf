import { describe, expect, it } from "vitest";

import {
  officialChartFixtures,
  officialExcludedChartTypes,
} from "../../example/src/data/official-chart-fixtures";
import { supportedGenericChartTypes } from "../../src";

describe("official chart fixtures", () => {
  it("excludes map and custom from official playground examples", () => {
    expect(officialExcludedChartTypes).toEqual(["custom", "map"]);
    expect(officialChartFixtures.map((fixture) => fixture.type)).not.toContain("map");
    expect(officialChartFixtures.map((fixture) => fixture.type)).not.toContain("custom");
  });

  it("covers every supported rendered type except map and custom", () => {
    const expected = supportedGenericChartTypes.filter((type) => type !== "map" && type !== "custom");

    expect(Array.from(new Set(officialChartFixtures.map((fixture) => fixture.type))).sort()).toEqual([...expected].sort());
  });

  it("keeps official fixtures curated instead of auto-generated from the whole catalog", () => {
    expect(officialChartFixtures.length).toBeLessThan(40);
    expect(officialChartFixtures.some((fixture) => fixture.summary.includes("로컬 데이터로 축약한 예제"))).toBe(false);
  });

  it("marks live fixtures as data-edit locked", () => {
    const liveFixtures = officialChartFixtures.filter((fixture) => fixture.live);

    expect(liveFixtures.length).toBeGreaterThan(0);
    expect(liveFixtures.every((fixture) => fixture.editableData === false)).toBe(true);
  });

  it("places mixed-series samples in the Advanced section", () => {
    const mixedFixtures = officialChartFixtures.filter((fixture) => fixture.mixedSeries);

    expect(mixedFixtures.length).toBeGreaterThan(0);
    expect(mixedFixtures.every((fixture) => fixture.section === "Advanced")).toBe(true);
  });

  it("keeps wordCloud fixtures on KMSF TOP data format", () => {
    const fixture = officialChartFixtures.find((item) => item.type === "wordCloud");

    expect(fixture).toBeDefined();
    expect(fixture?.dataFormat).toBe("top");
    expect(fixture?.series).toBeUndefined();
  });

  it("normalizes radar fixtures to a warning-safe percentage scale", () => {
    const fixture = officialChartFixtures.find((item) => item.type === "radar");
    const radar = fixture?.options?.radar as { indicator?: Array<{ max?: number }> } | undefined;

    expect(radar?.indicator?.every((item) => item.max === 100)).toBe(true);
  });
});
