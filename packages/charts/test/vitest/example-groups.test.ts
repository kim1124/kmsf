import { describe, expect, test } from "vitest";

import type { KmsfChartType } from "../../src";
import { buildLiveTrendRows, chartSamples } from "../../example/src/data/chart-samples";
import { chartExampleGroups, clampExampleSeriesCount, getExampleUsageCode } from "../../example/src/data/chart-examples";

const preparedTypes = new Set(["map", "custom"]);
const singleSeriesExampleTypes = new Set<KmsfChartType>(["funnel", "gauge", "pie", "sunburst", "themeRiver", "treemap", "wordCloud"]);
const zeroClock = { flowTick: 0, topTick: 0, trendTick: 0 };

describe("chart example groups", () => {
  test("renderable chart types expose curated basic and live examples without generated filler variants", () => {
    const renderableSamples = chartSamples.filter((sample) => !sample.disabledReason);
    const generatedVariantTitles = new Set(["옵션 변형", "데이터 변형", "레이아웃 변형"]);

    for (const sample of renderableSamples) {
      const examples = chartExampleGroups[sample.type] ?? [];
      expect(examples.length, sample.type).toBeGreaterThanOrEqual(2);
      expect(new Set(examples.map((example) => example.id)).size, sample.type).toBe(examples.length);
      expect(examples.some((example) => example.id === `${sample.type}-static-basic`), sample.type).toBe(true);
      expect(examples.filter((example) => example.mode === "live"), sample.type).toHaveLength(1);
      expect(examples.some((example) => generatedVariantTitles.has(example.title)), sample.type).toBe(false);
    }
  });

  test("map and custom are excluded from chart examples", () => {
    const types = chartSamples.map((sample) => sample.type);

    expect(types).not.toContain("map");
    expect(types).not.toContain("custom");
    expect(Object.keys(chartExampleGroups)).not.toContain("map");
    expect(Object.keys(chartExampleGroups)).not.toContain("custom");
  });

  test("mixed series official samples are grouped as Advanced examples", () => {
    expect(chartExampleGroups.pictorialBar?.some((example) => example.tags.includes("Advanced"))).toBe(true);
  });

  test("gauge page keeps only distinct official gauge examples", () => {
    const officialGaugeIds = ["gauge-simple", "gauge-progress", "gauge-grade", "gauge-ring", "gauge-barometer"];
    const examples = chartExampleGroups.gauge ?? [];
    const officialIds = examples.map((example) => example.officialExampleId).filter(Boolean);

    expect(officialIds).toEqual(expect.arrayContaining(officialGaugeIds));
    expect(officialIds).toHaveLength(officialGaugeIds.length);
  });

  test("official examples do not include generated fallback duplicates", () => {
    for (const examples of Object.values(chartExampleGroups)) {
      for (const example of examples ?? []) {
        expect(example.summary).not.toContain("로컬 데이터로 축약한 예제");
      }
    }
  });

  test("usage snippets prefer public wrapper components when the package exposes one", () => {
    const expectations: Partial<Record<KmsfChartType, string>> = {
      bar: "<TopChart",
      gauge: "<GaugeChart",
      graph: "<GraphChart",
      heatmap: "<HeatmapChart",
      line: "<TrendChart",
      pie: "<TopChart",
      radar: "<RadarChart",
      sankey: "<SankeyChart",
      sunburst: "<SunburstChart",
      treemap: "<TopChart",
      wordCloud: "<WordCloud",
    };

    for (const [type, componentSnippet] of Object.entries(expectations) as Array<[KmsfChartType, string]>) {
      const example = chartExampleGroups[type]?.find((item) => item.id === `${type}-static-basic`);

      expect(example, type).toBeDefined();
      expect(getExampleUsageCode(example!), type).toContain(componentSnippet);
      expect(getExampleUsageCode(example!), type).not.toContain("<GenericChart");
    }
  });

  test("controls are exposed only when the example can visibly react", () => {
    const heatmap = chartExampleGroups.heatmap?.find((example) => example.id === "heatmap-static-basic");
    const line = chartExampleGroups.line?.find((example) => example.id === "line-live-update");

    expect(heatmap?.controls?.legend).toBe(false);
    expect(heatmap?.controls?.tooltip).toBe(true);
    expect(line?.controls).toMatchObject({ legend: true, refresh: true, tooltip: true });
  });

  test("first static examples use official fixture data and options where available", () => {
    const line = chartExampleGroups.line?.find((example) => example.id === "line-static-basic");
    const lineContext = { clock: zeroClock, refreshVersion: 0, seriesCount: 1 };

    expect(line?.title).toBe("Basic Line Chart");
    expect(line?.dataFormat).toBe("native");
    expect(line?.buildData(lineContext)).toEqual([]);
    expect(line?.buildOptions?.(lineContext)).toMatchObject({
      xAxis: { data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], type: "category" },
    });
    expect(line?.buildSeries?.(lineContext)?.[0]).toMatchObject({
      data: [150, 230, 224, 218, 135, 147, 260],
      type: "line",
    });
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

  test("renderable live examples default to two series without exposing series count controls", () => {
    for (const sample of chartSamples) {
      if (preparedTypes.has(sample.type) || singleSeriesExampleTypes.has(sample.type)) {
        continue;
      }

      const liveExample = chartExampleGroups[sample.type]?.find((example) => example.mode === "live");
      expect(liveExample?.defaultSeriesCount, sample.type).toBe(2);
      expect(liveExample?.seriesCountEnabled, sample.type).toBe(false);
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

  test("line live example uses a thirty point five-second update window", () => {
    const liveExample = chartExampleGroups.line?.find((example) => example.id === "line-live-update");
    const data = liveExample?.buildData({ clock: zeroClock, refreshVersion: 0, seriesCount: 2 });

    expect(data).toHaveLength(30);
    expect(liveExample?.updateIntervalMs).toBe(5000);
  });

  test("line live data uses a bounded random-looking thirty second window", () => {
    const data = buildLiveTrendRows(0, 2) as Array<[string, number, number]>;

    for (const seriesIndex of [1, 2] as const) {
      const values = data.map((row) => row[seriesIndex]);
      const deltas = values.slice(1).map((value, index) => Math.abs(value - (values[index] ?? value)));

      expect(Math.min(...values), `series ${seriesIndex}`).toBeGreaterThanOrEqual(0);
      expect(Math.max(...values), `series ${seriesIndex}`).toBeLessThanOrEqual(500);
      expect(new Set(values).size, `series ${seriesIndex}`).toBeGreaterThan(24);
      expect(Math.max(...deltas), `series ${seriesIndex}`).toBeGreaterThanOrEqual(120);
    }
  });

  test("all live examples update every five seconds", () => {
    for (const sample of chartSamples) {
      if (sample.disabledReason) {
        continue;
      }

      const liveExample = chartExampleGroups[sample.type]?.find((example) => example.mode === "live");

      expect(liveExample?.updateIntervalMs, sample.type).toBe(5000);
    }
  });

  test("static examples do not inject title or subtitle by default", () => {
    for (const examples of Object.values(chartExampleGroups)) {
      for (const example of examples.filter((item) => item.mode === "static")) {
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
    expect(samples.wordCloud?.seriesOptions).toMatchObject({
      animationDurationUpdate: expect.any(Number),
      animationEasingUpdate: expect.any(String),
    });
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
    const series = example?.buildSeries?.({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 });

    expect((series?.[0] as { data?: unknown[] }).data).toHaveLength(5);
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

  test("tree data uses a deterministic official-like nested fixture", () => {
    const tree = chartExampleGroups.tree?.find((item) => item.id === "tree-static-basic");
    const before = tree?.buildData({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 });
    const after = tree?.buildData({ clock: zeroClock, refreshVersion: 1, seriesCount: 1 });

    expect(JSON.stringify(before)).toEqual(JSON.stringify(after));
    expect(JSON.stringify(before)).toContain("children");
    expect(JSON.stringify(before)).toContain("flare");
  });

  test("graph and sankey examples expose official-like node/link data", () => {
    const graph = chartExampleGroups.graph?.find((item) => item.id === "graph-static-basic");
    const sankey = chartExampleGroups.sankey?.find((item) => item.id === "sankey-static-basic");

    expect((graph?.buildData({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 }) as unknown[]).length).toBe(4);
    expect(sankey?.buildSeries?.({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 })?.[0]).toMatchObject({
      links: expect.arrayContaining([expect.objectContaining({ value: expect.any(Number) })]),
    });
    expect((sankey?.buildSeries?.({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 })?.[0] as { links?: unknown[] }).links).toHaveLength(6);
  });

  test("themeRiver uses multiple stream categories in one series", () => {
    const river = chartExampleGroups.themeRiver?.find((item) => item.id === "themeRiver-static-basic");
    const rows = river?.buildData({ clock: zeroClock, refreshVersion: 0, seriesCount: 1 }) as unknown[][];
    const categories = new Set(rows.map((row) => row[2]));

    expect(categories.size).toBeGreaterThanOrEqual(4);
  });
});
