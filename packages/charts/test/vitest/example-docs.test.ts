import { describe, expect, it } from "vitest";

import { chartSamples } from "../../example/src/data/chart-samples";
import { chartDocs, searchChartDocs } from "../../example/src/docs/chart-docs";

describe("example chart docs", () => {
  it("documents every visible chart sample with required props and example code", () => {
    const documentedTypes = new Set(chartDocs.map((doc) => doc.type));

    for (const sample of chartSamples) {
      expect(documentedTypes.has(sample.type)).toBe(true);
    }

    for (const doc of chartDocs) {
      expect(doc.markdown).toContain("## Required Props");
      expect(doc.markdown).toContain("```tsx");
      expect(doc.officialDocsUrl).toMatch(/^https:\/\/echarts\.apache\.org\//);
    }
  });

  it("searches chart docs by prop, option, and feature terms", () => {
    expect(searchChartDocs("seriesOptions").some((doc) => doc.type === "line")).toBe(true);
    expect(searchChartDocs("실시간").some((doc) => doc.type === "line")).toBe(true);
    expect(searchChartDocs("존재하지않는검색어")).toEqual([]);
  });
});
