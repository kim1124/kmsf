import { describe, expect, test } from "vitest";

import { chartSamples } from "../../example/src/data/chart-samples";
import { chartExampleGroups, clampExampleSeriesCount } from "../../example/src/data/chart-examples";

describe("chart example groups", () => {
  test("renderable chart types expose three to five examples", () => {
    const renderableSamples = chartSamples.filter((sample) => !sample.disabledReason);

    for (const sample of renderableSamples) {
      const examples = chartExampleGroups[sample.type] ?? [];
      expect(examples.length, sample.type).toBeGreaterThanOrEqual(3);
      expect(examples.length, sample.type).toBeLessThanOrEqual(5);
    }
  });

  test("examples include stable metadata for filtering and tags", () => {
    for (const [type, examples] of Object.entries(chartExampleGroups)) {
      for (const example of examples) {
        expect(example.id).toMatch(new RegExp(`^${type}-`));
        expect(example.title.length).toBeGreaterThan(0);
        expect(example.summary.length).toBeGreaterThan(0);
        expect(example.tags.length).toBeGreaterThan(0);
        expect(["static", "live"]).toContain(example.mode);
      }
    }
  });

  test("series count is clamped from one to ten", () => {
    expect(clampExampleSeriesCount(-1)).toBe(1);
    expect(clampExampleSeriesCount(1)).toBe(1);
    expect(clampExampleSeriesCount(7)).toBe(7);
    expect(clampExampleSeriesCount(10)).toBe(10);
    expect(clampExampleSeriesCount(99)).toBe(10);
  });
});
