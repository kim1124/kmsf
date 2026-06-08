import { describe, expect, test } from "vitest";

import type { KmsfChartType } from "../../src";
import { buildLiveTrendRows, chartSamples } from "../../example/src/data/chart-samples";
import { chartExampleGroups, clampExampleSeriesCount } from "../../example/src/data/chart-examples";

const preparedTypes = new Set(["map", "custom"]);
const singleSeriesExampleTypes = new Set<KmsfChartType>(["funnel", "gauge", "pie", "sunburst", "themeRiver", "treemap", "wordCloud"]);
const zeroClock = { flowTick: 0, topTick: 0, trendTick: 0 };

describe("chart example groups", () => {
  test("renderable chart types expose exactly five examples", () => {
    const renderableSamples = chartSamples.filter((sample) => !sample.disabledReason);

    for (const sample of renderableSamples) {
      const examples = chartExampleGroups[sample.type] ?? [];
      expect(examples, sample.type).toHaveLength(5);
      expect(new Set(examples.map((example) => example.id)).size, sample.type).toBe(5);
      expect(new Set(examples.map((example) => example.title)).size, sample.type).toBe(5);
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

  test("renderable live examples default to three series", () => {
    for (const sample of chartSamples) {
      if (preparedTypes.has(sample.type) || singleSeriesExampleTypes.has(sample.type)) {
        continue;
      }

      const liveExample = chartExampleGroups[sample.type]?.find((example) => example.mode === "live");
      expect(liveExample?.defaultSeriesCount, sample.type).toBe(3);
      expect(liveExample?.seriesCountEnabled, sample.type).toBe(true);
    }
  });

  test("single-series example types do not expose series count controls", () => {
    for (const type of singleSeriesExampleTypes) {
      for (const example of chartExampleGroups[type] ?? []) {
        expect(example.seriesCountEnabled, type).toBe(false);
        expect(example.defaultSeriesCount, type).toBeUndefined();
      }
    }
  });

  test("line live example uses a one minute one-second window", () => {
    const liveExample = chartExampleGroups.line?.find((example) => example.id === "line-live-update");
    const data = liveExample?.buildData({ clock: zeroClock, refreshVersion: 0, seriesCount: 3 });

    expect(data).toHaveLength(60);
    expect(liveExample?.updateIntervalMs).toBe(1000);
  });

  test("line live data uses a bounded random-looking one-minute window", () => {
    const data = buildLiveTrendRows(0, 3) as Array<[string, number, number, number]>;

    for (const seriesIndex of [1, 2, 3] as const) {
      const values = data.map((row) => row[seriesIndex]);
      const deltas = values.slice(1).map((value, index) => Math.abs(value - (values[index] ?? value)));

      expect(Math.min(...values), `series ${seriesIndex}`).toBeGreaterThanOrEqual(0);
      expect(Math.max(...values), `series ${seriesIndex}`).toBeLessThanOrEqual(500);
      expect(new Set(values).size, `series ${seriesIndex}`).toBeGreaterThan(42);
      expect(Math.max(...deltas), `series ${seriesIndex}`).toBeGreaterThanOrEqual(120);
    }
  });

  test("TOP live examples update every five seconds", () => {
    for (const sample of chartSamples) {
      if (sample.category !== "Top" || sample.disabledReason) {
        continue;
      }

      const liveExample = chartExampleGroups[sample.type]?.find((example) => example.mode === "live");

      expect(liveExample?.updateIntervalMs, sample.type).toBe(5000);
    }
  });

  test("option variants do not inject title or subtitle by default", () => {
    for (const examples of Object.values(chartExampleGroups)) {
      for (const example of examples.filter((item) => item.id.endsWith("option-variant"))) {
        const options = example.buildOptions?.({ clock: zeroClock, refreshVersion: 0, seriesCount: 3 });
        const title = Array.isArray(options?.title) ? options?.title[0] : options?.title;

        expect(title, example.id).toBeUndefined();
      }
    }
  });

  test("single-series chart examples use full-size layouts", () => {
    const samples = Object.fromEntries(chartSamples.map((sample) => [sample.type, sample]));

    expect(samples.pie?.seriesOptions).toMatchObject({ center: ["34%", "52%"], radius: ["32%", "66%"] });
    expect(samples.treemap?.seriesOptions).toMatchObject({ height: "88%", left: "4%", top: "6%", width: "92%" });
    expect(samples.funnel?.seriesOptions).toMatchObject({ label: { show: false }, left: "12%", top: 48, width: "76%" });
    expect(samples.wordCloud?.seriesOptions).toMatchObject({ height: "88%", left: "4%", top: "6%", width: "92%" });
    expect(samples.sunburst?.seriesOptions).toMatchObject({
      center: ["50%", "52%"],
      label: { show: false },
      radius: ["12%", "86%"],
    });

    const gaugeSeries = samples.gauge?.buildSeries?.(zeroClock, 1);
    expect(gaugeSeries?.[0]).toMatchObject({
      axisLine: expect.objectContaining({ lineStyle: expect.objectContaining({ width: expect.any(Number) }) }),
      center: ["50%", "58%"],
      progress: expect.objectContaining({ show: true }),
      radius: "66%",
    });
  });

  test("funnel example uses five rows", () => {
    const example = chartExampleGroups.funnel?.find((item) => item.id === "funnel-static-basic");
    const data = example?.buildData({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 });

    expect(data).toHaveLength(5);
  });

  test.each(["scatter", "effectScatter"] as const)("%s examples can produce separate data columns for three series", (type) => {
    const liveExample = chartExampleGroups[type]?.find((example) => example.mode === "live");
    const data = liveExample?.buildData({ clock: zeroClock, refreshVersion: 0, seriesCount: 3 });

    expect((data as unknown[][])[0], type).toHaveLength(4);
  });

  test.each(["tree", "sankey", "parallel", "radar"] as const)("%s live example exposes three series", (type) => {
    const liveExample = chartExampleGroups[type]?.find((example) => example.mode === "live");
    const series = liveExample?.buildSeries?.({ clock: zeroClock, refreshVersion: 0, seriesCount: 3 });

    expect(series, type).toHaveLength(3);
  });

  test("tree data has nested depth and refresh-visible values", () => {
    const tree = chartExampleGroups.tree?.find((item) => item.id === "tree-static-basic");
    const before = tree?.buildData({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 });
    const after = tree?.buildData({ clock: zeroClock, refreshVersion: 1, seriesCount: 1 });

    expect(JSON.stringify(before)).not.toEqual(JSON.stringify(after));
    expect(JSON.stringify(before)).toContain("children");
    expect(JSON.stringify(before)).toContain("Leaf");
  });

  test("graph and sankey examples expose richer node/link data", () => {
    const graph = chartExampleGroups.graph?.find((item) => item.id === "graph-static-basic");
    const sankey = chartExampleGroups.sankey?.find((item) => item.id === "sankey-static-basic");

    expect((graph?.buildData({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 }) as unknown[]).length).toBeGreaterThanOrEqual(8);
    expect(sankey?.buildSeries?.({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 })?.[0]).toMatchObject({
      links: expect.arrayContaining([expect.objectContaining({ value: expect.any(Number) })]),
    });
    expect((sankey?.buildSeries?.({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 })?.[0] as { links?: unknown[] }).links?.length).toBeGreaterThanOrEqual(10);
  });

  test("themeRiver uses multiple stream categories in one series", () => {
    const river = chartExampleGroups.themeRiver?.find((item) => item.id === "themeRiver-static-basic");
    const rows = river?.buildData({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 }) as unknown[][];
    const categories = new Set(rows.map((row) => row[2]));

    expect(categories.size).toBeGreaterThanOrEqual(4);
  });
});
