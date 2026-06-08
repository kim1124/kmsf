import { describe, expect, it } from "vitest";

import { chartSamples } from "../../example/src/data/chart-samples";
import { buildDocSearchTargets } from "../../example/src/data/doc-search";
import { chartDocs, getChartDoc, searchChartDocs } from "../../example/src/docs/chart-docs";

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
    expect(getChartDoc("custom").category).toBe("advanced");
  });

  it("documents KMSF required props and chart-specific ECharts settings in one section", () => {
    const pieDoc = getChartDoc("pie");
    expect(pieDoc.markdown).toContain("## 필수 설정");
    expect(pieDoc.markdown).toContain("`type`: `pie`");
    expect(pieDoc.markdown).toContain("`data`");
    expect(pieDoc.markdown).toContain("`colors`");
    expect(pieDoc.markdown).toContain("[KMSF Charts]");
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
