import { describe, expect, it } from "vitest";

import { chartSamples } from "../../example/src/data/chart-samples";
import { buildDocSearchTargets } from "../../example/src/data/doc-search";
import {
  chartApiDocs,
  chartApiFeatureDocs,
  chartDocs,
  getChartApiDoc,
  getChartDoc,
  searchChartDocs,
} from "../../example/src/docs/chart-docs";

describe("example chart docs", () => {
  function collectRenderedBlockIds(markdown: string, prefix: string) {
    const blockIds: string[] = [];
    const lines = markdown.split("\n");
    let index = 0;

    while (index < lines.length) {
      const line = lines[index] ?? "";

      if (!line.trim()) {
        index += 1;
        continue;
      }

      if (line.startsWith("```")) {
        blockIds.push(`${prefix}-${index}`);
        index += 1;

        while (index < lines.length && !lines[index]?.startsWith("```")) {
          index += 1;
        }

        index += 1;
        continue;
      }

      if (line.startsWith("- ")) {
        blockIds.push(`${prefix}-${index}`);

        while (index < lines.length && lines[index]?.startsWith("- ")) {
          index += 1;
        }

        continue;
      }

      blockIds.push(`${prefix}-${index}`);
      index += 1;
    }

    return blockIds;
  }

  it("documents every visible chart sample with required props and example code", () => {
    const documentedTypes = new Set(chartDocs.map((doc) => doc.type));

    for (const sample of chartSamples) {
      expect(documentedTypes.has(sample.type)).toBe(true);
    }

    for (const doc of chartDocs) {
      expect(doc.markdown).toContain("## 필수 설정");
      expect(doc.markdown).toContain("```tsx");
      expect(doc.officialDocsUrl).toMatch(/^https:\/\//);
    }
  });

  it("groups chart docs by usage difficulty", () => {
    expect(getChartDoc("line").category).toBe("easy");
    expect(getChartDoc("sankey").category).toBe("native-required");
    expect(chartDocs.map((doc) => doc.type)).not.toContain("custom");
    expect(chartDocs.map((doc) => doc.type)).not.toContain("map");
  });

  it("documents KMSF required props and chart-specific ECharts settings in one section", () => {
    const pieDoc = getChartDoc("pie");
    expect(pieDoc.markdown).toContain("## 필수 설정");
    expect(pieDoc.markdown).toContain("`type`: `pie`");
    expect(pieDoc.markdown).toContain("`data`");
    expect(pieDoc.markdown).toContain("`colors`");
    expect(pieDoc.markdown).toContain("browser console warning/error를 발생시키지 않습니다");
    expect(pieDoc.markdown).toContain("## Recommended Props");
    expect(pieDoc.markdown).not.toContain("## Required ECharts Settings");
    expect(pieDoc.markdown).toContain("[series-pie](https://echarts.apache.org/en/option.html#series-pie)");

    const radarDoc = getChartDoc("radar");
    expect(radarDoc.markdown).toContain("## 필수 설정");
    expect(radarDoc.markdown).not.toContain("## Required ECharts Settings");
    expect(radarDoc.markdown).toContain("`options` / `options.radar.indicator`");
    expect(radarDoc.markdown).toContain("[radar](https://echarts.apache.org/en/option.html#radar)");
    expect(radarDoc.markdown).toContain("[series-radar](https://echarts.apache.org/en/option.html#series-radar)");
  });

  it("exposes chart-by-chart API sections for props, options, and series options", () => {
    const apiTypes = new Set(chartApiDocs.map((doc) => doc.type));

    for (const sample of chartSamples) {
      expect(apiTypes.has(sample.type), sample.type).toBe(true);
    }

    for (const doc of chartApiDocs) {
      expect(doc.sections.map((section) => section.title), doc.type).toEqual([
        "KMSF Props",
        "ECharts Options",
        "SeriesOptions",
        "Methods/Utilities",
      ]);
      expect(doc.sections.every((section) => section.entries.length > 0), doc.type).toBe(true);
      if (["line", "bar", "pie", "treemap", "gauge", "wordCloud", "sunburst", "radar", "heatmap", "graph", "sankey"].includes(doc.type)) {
        expect(doc.exampleCode, doc.type).not.toContain("<GenericChart");
      } else {
        expect(doc.exampleCode, doc.type).toContain("<GenericChart");
      }
      expect(doc.liveExamplePath, doc.type).toBe(`/examples/${doc.type}#${doc.type}-live-update`);
    }

    const heatmapApi = getChartApiDoc("heatmap");
    const heatmapOptions = heatmapApi.sections.find((section) => section.title === "ECharts Options");

    expect(heatmapOptions?.entries.map((entry) => entry.code)).toContain("options.visualMap");
    expect(heatmapOptions?.entries.map((entry) => entry.code)).toContain("options.xAxis");
    expect(heatmapOptions?.entries.map((entry) => entry.code)).toContain("options.yAxis");
  });

  it("exposes feature-based API sections for the playground API page", () => {
    expect(chartApiFeatureDocs.map((section) => section.title)).toEqual([
      "GenericChart 렌더링",
      "Trend / Top 데이터",
      "Native 필수 옵션",
      "Legend / Tooltip / Theme",
      "Lifecycle / Methods",
    ]);

    for (const section of chartApiFeatureDocs) {
      expect(section.id).toMatch(/^api-/);
      expect(section.summary.length).toBeGreaterThan(10);
      expect(section.props.length, section.title).toBeGreaterThan(0);
      expect(section.options.length, section.title).toBeGreaterThan(0);
      expect(section.samples.length, section.title).toBeGreaterThan(0);
    }

    const nativeSection = chartApiFeatureDocs.find((section) => section.id === "api-native-required-options");

    expect(nativeSection?.options.map((entry) => entry.name)).toContain("heatmap: options.visualMap");
    expect(nativeSection?.options.map((entry) => entry.name)).toContain("radar: options.radar.indicator");
    expect(nativeSection?.samples.some((sample) => sample.code.includes("<HeatmapChart"))).toBe(true);
    expect(nativeSection?.liveLinks.map((link) => link.path)).toContain("/examples/heatmap#heatmap-live-update");
  });

  it("searches chart docs by prop, option, and feature terms", () => {
    expect(searchChartDocs("seriesOptions").some((doc) => doc.type === "line")).toBe(true);
    expect(searchChartDocs("options.radar.indicator").some((doc) => doc.type === "radar")).toBe(true);
    expect(searchChartDocs("실시간").some((doc) => doc.type === "line")).toBe(true);
    expect(searchChartDocs("존재하지않는검색어")).toEqual([]);
  });

  it("builds doc search targets that point to rendered markdown blocks", () => {
    const pieDoc = getChartDoc("pie");
    const prefix = "doc-block-pie";
    const renderedBlockIds = collectRenderedBlockIds(pieDoc.markdown, prefix);

    for (const query of ["tooltip", "loadingFallback"]) {
      const target = buildDocSearchTargets(pieDoc, query).at(0);

      expect(target, query).toBeDefined();
      expect(renderedBlockIds, query).toContain(target!.id);
    }
  });
});
