import type { KmsfChartType } from "../../../src";
import { chartSamples } from "../data/chart-samples";

export interface ChartDoc {
  markdown: string;
  officialDocsUrl: string;
  searchText: string;
  title: string;
  type: KmsfChartType;
}

function getDataFormatDescription(type: KmsfChartType, dataFormat: string | undefined) {
  if (dataFormat === "trend") {
    return "`data`: `[[time, value], ...]` 형태의 추이 데이터입니다. `time`은 문자열 또는 `Date`를 사용할 수 있습니다.";
  }

  if (dataFormat === "top") {
    return "`data`: `[name, value]` 또는 `[[name, value], ...]` 형태의 단순 TOP 데이터입니다.";
  }

  if (type === "sankey") {
    return "`data`: ECharts `series-sankey.data` 구조입니다. `series`에는 `links`를 전달합니다.";
  }

  if (type === "graph") {
    return "`data`: ECharts `series-graph.data` node 구조입니다. `series`에는 `links`, `layout`, `roam` 등을 전달합니다.";
  }

  if (type === "tree" || type === "sunburst") {
    return "`data`: ECharts tree 계열의 `children` 구조를 그대로 전달합니다.";
  }

  return "`data`: ECharts 공식 `series.data` 구조를 따릅니다.";
}

function getExampleCode(type: KmsfChartType, dataFormat: string | undefined) {
  if (dataFormat === "trend") {
    return `<GenericChart
  type="${type}"
  data={[
    ["2026-05-26 10:00:00", 120],
    ["2026-05-26 10:00:01", 132],
  ]}
  dataFormat="trend"
/>`;
  }

  if (dataFormat === "top") {
    return `<GenericChart
  type="${type}"
  data={[
    ["Alpha", 120],
    ["Beta", 96],
  ]}
  dataFormat="top"
/>`;
  }

  if (type === "sankey") {
    return `<GenericChart
  type="sankey"
  data={[{ name: "Visit" }, { name: "Signup" }]}
  series={[{ links: [{ source: "Visit", target: "Signup", value: 10 }] }]}
  dataFormat="native"
/>`;
  }

  return `<GenericChart
  type="${type}"
  data={echartsSeriesData}
  options={echartsOptions}
  dataFormat="native"
/>`;
}

function buildMarkdown(type: KmsfChartType) {
  const sample = chartSamples.find((item) => item.type === type);
  const dataFormat = sample?.dataFormat ?? "native";
  const disabledNote = sample?.disabledReason ? `\n\n## Note\n\n- ${sample.disabledReason}` : "";

  return `# ${type}

${sample?.summary ?? "ECharts native chart"}

## Required Props

- \`type\`: \`${type}\`
- ${getDataFormatDescription(type, dataFormat)}
- \`dataFormat\`: \`${dataFormat}\`

## Common Options

- \`legend\`: \`boolean | object\`로 범례 표시를 제어합니다.
- \`tooltip\`: \`boolean | object\`로 툴팁 표시를 제어합니다.
- \`seriesOptions\`: 모든 series 또는 series별 속성을 덮어씁니다.
- \`options\`: ECharts 공식 option 구조를 그대로 전달합니다.

## Example

\`\`\`tsx
${getExampleCode(type, dataFormat)}
\`\`\`

## Official Docs

세부 series 옵션은 ECharts 공식 문서를 기준으로 확인합니다.${disabledNote}`;
}

export const chartDocs: ChartDoc[] = chartSamples.map((sample) => {
  const markdown = buildMarkdown(sample.type);
  const officialDocsUrl = `https://echarts.apache.org/en/option.html#series-${sample.type}`;

  return {
    markdown,
    officialDocsUrl,
    searchText: [
      sample.type,
      sample.category,
      sample.summary,
      sample.dataFormat,
      sample.disabledReason,
      "data",
      "options",
      "seriesOptions",
      "legend",
      "tooltip",
      "resize",
      "리사이즈",
      "실시간",
      "옵션",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
    title: sample.type,
    type: sample.type,
  };
});

export function getChartDoc(type: KmsfChartType) {
  return chartDocs.find((doc) => doc.type === type) ?? chartDocs[0]!;
}

export function searchChartDocs(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return chartDocs;
  }

  return chartDocs.filter((doc) => `${doc.searchText} ${doc.markdown.toLowerCase()}`.includes(normalizedQuery));
}
