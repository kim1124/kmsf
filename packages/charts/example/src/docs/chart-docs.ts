import type { KmsfChartType } from "../../../src";
import { chartSamples } from "../data/chart-samples";
import type { ChartSample } from "../data/chart-samples";

export type ChartDocCategory = "advanced" | "easy" | "native-required";

export interface ChartDoc {
  category: ChartDocCategory;
  markdown: string;
  officialDocs: Array<{ label: string; url: string }>;
  officialDocsUrl: string;
  searchText: string;
  title: string;
  type: KmsfChartType;
}

interface RequiredEchartsSetting {
  code: string;
  description: string;
  prop: "options" | "series" | "seriesOptions";
}

interface ChartDocDefinition {
  dataDescription: string;
  exampleCode: string;
  officialDocs: Array<{ label: string; url: string }>;
  recommendedProps?: string[];
  requiredEchartsSettings?: RequiredEchartsSetting[];
  type: KmsfChartType;
}

const officialSeriesDocs: Record<KmsfChartType, string> = {
  bar: "https://echarts.apache.org/en/option.html#series-bar",
  line: "https://echarts.apache.org/en/option.html#series-line",
  pie: "https://echarts.apache.org/en/option.html#series-pie",
  scatter: "https://echarts.apache.org/en/option.html#series-scatter",
  effectScatter: "https://echarts.apache.org/en/option.html#series-effectScatter",
  candlestick: "https://echarts.apache.org/en/option.html#series-candlestick",
  radar: "https://echarts.apache.org/en/option.html#series-radar",
  heatmap: "https://echarts.apache.org/en/option.html#series-heatmap",
  tree: "https://echarts.apache.org/en/option.html#series-tree",
  treemap: "https://echarts.apache.org/en/option.html#series-treemap",
  sunburst: "https://echarts.apache.org/en/option.html#series-sunburst",
  map: "https://echarts.apache.org/en/option.html#series-map",
  lines: "https://echarts.apache.org/en/option.html#series-lines",
  graph: "https://echarts.apache.org/en/option.html#series-graph",
  boxplot: "https://echarts.apache.org/en/option.html#series-boxplot",
  parallel: "https://echarts.apache.org/en/option.html#series-parallel",
  gauge: "https://echarts.apache.org/en/option.html#series-gauge",
  funnel: "https://echarts.apache.org/en/option.html#series-funnel",
  sankey: "https://echarts.apache.org/en/option.html#series-sankey",
  themeRiver: "https://echarts.apache.org/en/option.html#series-themeRiver",
  pictorialBar: "https://echarts.apache.org/en/option.html#series-pictorialBar",
  custom: "https://echarts.apache.org/en/option.html#series-custom",
  wordCloud: "https://github.com/ecomfe/echarts-wordcloud",
};

const componentDocs = {
  parallelAxis: "https://echarts.apache.org/en/option.html#parallelAxis",
  radar: "https://echarts.apache.org/en/option.html#radar",
  singleAxis: "https://echarts.apache.org/en/option.html#singleAxis",
  visualMap: "https://echarts.apache.org/en/option.html#visualMap",
};

function seriesDoc(type: KmsfChartType) {
  return { label: `series-${type}`, url: officialSeriesDocs[type] };
}

function topExample(type: KmsfChartType) {
  return `<GenericChart
  type="${type}"
  data={[
    ["Alpha", 120],
    ["Beta", 96],
  ]}
  dataFormat="top"
/>`;
}

function trendExample(type: KmsfChartType) {
  return `<GenericChart
  type="${type}"
  data={[
    ["2026-05-26 10:00:00", 120],
    ["2026-05-26 10:00:01", 132],
  ]}
  dataFormat="trend"
/>`;
}

const chartDocDefinitions: Record<KmsfChartType, ChartDocDefinition> = {
  line: {
    type: "line",
    dataDescription: "`data`: `[[time, value], ...]` 형태의 추이 데이터입니다. `time`은 문자열 또는 `Date`를 사용할 수 있습니다.",
    recommendedProps: ["`dataFormat`: `trend`", "`seriesOptions.smooth`: 기본 `true`입니다."],
    officialDocs: [seriesDoc("line")],
    exampleCode: trendExample("line"),
  },
  bar: {
    type: "bar",
    dataDescription: "`data`: `[[name, value], ...]` 형태의 TOP 데이터입니다.",
    recommendedProps: ["`dataFormat`: `top`"],
    officialDocs: [seriesDoc("bar")],
    exampleCode: topExample("bar"),
  },
  pie: {
    type: "pie",
    dataDescription: "`data`: `[[name, value], ...]` 형태의 TOP 데이터입니다.",
    recommendedProps: [
      "`dataFormat`: `top`",
      "`legend`: 기본 `true`이며 오른쪽 세로 scroll legend와 왼쪽 pie center를 적용합니다.",
    ],
    officialDocs: [seriesDoc("pie")],
    exampleCode: topExample("pie"),
  },
  scatter: {
    type: "scatter",
    dataDescription: "`data`: `[[time, value], ...]` 형태의 추이 또는 좌표 데이터입니다.",
    recommendedProps: ["`dataFormat`: `trend`"],
    officialDocs: [seriesDoc("scatter")],
    exampleCode: trendExample("scatter"),
  },
  effectScatter: {
    type: "effectScatter",
    dataDescription: "`data`: `[[time, value], ...]` 형태의 추이 또는 좌표 데이터입니다.",
    recommendedProps: ["`dataFormat`: `trend`"],
    officialDocs: [seriesDoc("effectScatter")],
    exampleCode: trendExample("effectScatter"),
  },
  candlestick: {
    type: "candlestick",
    dataDescription: "`data`: `[[open, close, lowest, highest], ...]` 형태의 OHLC 데이터입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    requiredEchartsSettings: [
      { prop: "options", code: "options.xAxis", description: "캔들 항목을 배치할 category 축을 정의합니다." },
      { prop: "options", code: "options.yAxis", description: "가격 범위를 표시할 value 축을 정의합니다." },
    ],
    officialDocs: [seriesDoc("candlestick")],
    exampleCode: `<GenericChart
  type="candlestick"
  data={[
    [20, 34, 10, 38],
    [40, 35, 30, 50],
  ]}
  dataFormat="native"
  options={{
    xAxis: { type: "category", data: ["A", "B"] },
    yAxis: { type: "value" },
  }}
/>`,
  },
  radar: {
    type: "radar",
    dataDescription: "`data`: `[{ name, value: number[] }]` 형태의 radar series data입니다.",
    recommendedProps: [
      "`dataFormat`: `native`",
      "`legend`: 표시 시 기본 radar center/radius를 조정해 legend와 chart 간격을 확보합니다.",
    ],
    requiredEchartsSettings: [
      { prop: "options", code: "options.radar.indicator", description: "각 radar 축의 이름과 최대값을 정의합니다." },
    ],
    officialDocs: [
      { label: "radar", url: componentDocs.radar },
      seriesDoc("radar"),
    ],
    exampleCode: `<GenericChart
  type="radar"
  data={[{ name: "KMSF", value: [92, 84, 78] }]}
  dataFormat="native"
  options={{
    radar: {
      indicator: [
        { name: "UX", max: 100 },
        { name: "API", max: 100 },
        { name: "Perf", max: 100 },
      ],
    },
  }}
/>`,
  },
  heatmap: {
    type: "heatmap",
    dataDescription: "`data`: `[[xIndex, yIndex, value], ...]` 형태의 matrix 데이터입니다.",
    recommendedProps: ["`dataFormat`: `native`", "`legend`: 기본 `false`입니다."],
    requiredEchartsSettings: [
      { prop: "options", code: "options.xAxis", description: "x축 category 또는 좌표계를 정의합니다." },
      { prop: "options", code: "options.yAxis", description: "y축 category 또는 좌표계를 정의합니다." },
      { prop: "options", code: "options.visualMap", description: "값을 색상 범위로 매핑합니다." },
    ],
    officialDocs: [
      seriesDoc("heatmap"),
      { label: "visualMap", url: componentDocs.visualMap },
    ],
    exampleCode: `<GenericChart
  type="heatmap"
  data={[
    [0, 0, 42],
    [1, 0, 56],
  ]}
  dataFormat="native"
  options={{
    visualMap: { min: 0, max: 100 },
    xAxis: { type: "category", data: ["Mon", "Tue"] },
    yAxis: { type: "category", data: ["A"] },
  }}
/>`,
  },
  tree: {
    type: "tree",
    dataDescription: "`data`: `[{ name, value?, children? }]` 형태의 계층 데이터입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    officialDocs: [seriesDoc("tree")],
    exampleCode: `<GenericChart
  type="tree"
  data={[
    {
      name: "Root",
      children: [{ name: "Alpha", value: 40 }],
    },
  ]}
  dataFormat="native"
/>`,
  },
  treemap: {
    type: "treemap",
    dataDescription: "`data`: `[[name, value], ...]` 형태의 TOP 데이터입니다. 계층형 treemap은 ECharts native data를 사용합니다.",
    recommendedProps: ["`dataFormat`: `top`"],
    officialDocs: [seriesDoc("treemap")],
    exampleCode: topExample("treemap"),
  },
  sunburst: {
    type: "sunburst",
    dataDescription: "`data`: `[{ name, value?, children? }]` 형태의 계층 데이터입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    officialDocs: [seriesDoc("sunburst")],
    exampleCode: `<GenericChart
  type="sunburst"
  data={[
    {
      name: "Traffic",
      children: [{ name: "Organic", value: 46 }],
    },
  ]}
  dataFormat="native"
/>`,
  },
  map: {
    type: "map",
    dataDescription: "`data`: ECharts map `series.data` 구조의 지역별 값입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    requiredEchartsSettings: [
      { prop: "seriesOptions", code: "seriesOptions.map", description: "미리 등록된 map resource 이름을 지정합니다." },
    ],
    officialDocs: [seriesDoc("map")],
    exampleCode: `<GenericChart
  type="map"
  data={[{ name: "Seoul", value: 120 }]}
  dataFormat="native"
  seriesOptions={{ map: "korea" }}
/>`,
  },
  lines: {
    type: "lines",
    dataDescription: "`data`: `[{ coords: [[x1, y1], [x2, y2]] }]` 형태의 경로 데이터입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    requiredEchartsSettings: [
      { prop: "seriesOptions", code: "seriesOptions.coordinateSystem", description: "cartesian2d, geo 등 사용할 좌표계를 지정합니다." },
      { prop: "options", code: "options.xAxis / options.yAxis", description: "cartesian2d 좌표계를 사용할 때 축을 정의합니다." },
    ],
    officialDocs: [seriesDoc("lines")],
    exampleCode: `<GenericChart
  type="lines"
  data={[{ coords: [[0, 0], [4, 6]] }]}
  dataFormat="native"
  seriesOptions={{ coordinateSystem: "cartesian2d" }}
  options={{
    xAxis: { type: "value", min: 0, max: 10 },
    yAxis: { type: "value", min: 0, max: 10 },
  }}
/>`,
  },
  graph: {
    type: "graph",
    dataDescription: "`data`: `[{ name, x?, y?, value? }]` 형태의 node 데이터입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    requiredEchartsSettings: [
      { prop: "series", code: "series[].links", description: "node 간 연결 관계를 source, target으로 정의합니다." },
    ],
    officialDocs: [seriesDoc("graph")],
    exampleCode: `<GenericChart
  type="graph"
  data={[
    { name: "Visit", x: 80, y: 140 },
    { name: "Signup", x: 220, y: 80 },
  ]}
  dataFormat="native"
  series={[{
    layout: "none",
    links: [{ source: "Visit", target: "Signup" }],
  }]}
/>`,
  },
  boxplot: {
    type: "boxplot",
    dataDescription: "`data`: `[[min, Q1, median, Q3, max], ...]` 형태의 five-number summary입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    requiredEchartsSettings: [
      { prop: "options", code: "options.xAxis", description: "boxplot 항목을 배치할 category 축을 정의합니다." },
      { prop: "options", code: "options.yAxis", description: "분포 값을 표시할 value 축을 정의합니다." },
    ],
    officialDocs: [seriesDoc("boxplot")],
    exampleCode: `<GenericChart
  type="boxplot"
  data={[[18, 24, 31, 42, 55]]}
  dataFormat="native"
  options={{
    xAxis: { type: "category", data: ["A"] },
    yAxis: { type: "value" },
  }}
/>`,
  },
  parallel: {
    type: "parallel",
    dataDescription: "`data`: `[[dim0, dim1, dim2], ...]` 형태의 다차원 row 데이터입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    requiredEchartsSettings: [
      { prop: "options", code: "options.parallelAxis", description: "각 dimension에 대응되는 parallel 축을 정의합니다." },
    ],
    officialDocs: [
      seriesDoc("parallel"),
      { label: "parallelAxis", url: componentDocs.parallelAxis },
    ],
    exampleCode: `<GenericChart
  type="parallel"
  data={[
    [12, 38, 42],
    [28, 55, 64],
  ]}
  dataFormat="native"
  options={{
    parallelAxis: [
      { dim: 0, name: "Speed" },
      { dim: 1, name: "Cost" },
      { dim: 2, name: "Score" },
    ],
  }}
/>`,
  },
  gauge: {
    type: "gauge",
    dataDescription: "`data`: `[[name, value], ...]` 형태의 단일 지표 또는 TOP 데이터입니다.",
    recommendedProps: ["`dataFormat`: `top`", "`seriesOptions`: `min`, `max` 등 gauge 표시 범위 조정"],
    officialDocs: [seriesDoc("gauge")],
    exampleCode: `<GenericChart
  type="gauge"
  data={[["Conversion", 72]]}
  dataFormat="top"
  seriesOptions={{ min: 0, max: 100 }}
/>`,
  },
  funnel: {
    type: "funnel",
    dataDescription: "`data`: `[[name, value], ...]` 형태의 TOP 데이터입니다.",
    recommendedProps: ["`dataFormat`: `top`", "`label`: 기본 숨김입니다.", "`tooltip`: single-series TOP tooltip은 `Item N` 라벨을 사용합니다."],
    officialDocs: [seriesDoc("funnel")],
    exampleCode: topExample("funnel"),
  },
  sankey: {
    type: "sankey",
    dataDescription: "`data`: `[{ name }]` 형태의 node 목록입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    requiredEchartsSettings: [
      { prop: "series", code: "series[].links", description: "흐름의 source, target, value를 정의합니다." },
    ],
    officialDocs: [seriesDoc("sankey")],
    exampleCode: `<GenericChart
  type="sankey"
  data={[{ name: "Visit" }, { name: "Signup" }]}
  dataFormat="native"
  series={[{
    links: [{ source: "Visit", target: "Signup", value: 10 }],
  }]}
/>`,
  },
  themeRiver: {
    type: "themeRiver",
    dataDescription: "`data`: `[[time, value, name], ...]` 형태의 시간, 값, 범주 데이터입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    requiredEchartsSettings: [
      { prop: "options", code: "options.singleAxis", description: "themeRiver가 배치될 단일 time/value 축을 정의합니다." },
    ],
    officialDocs: [
      seriesDoc("themeRiver"),
      { label: "singleAxis", url: componentDocs.singleAxis },
    ],
    exampleCode: `<GenericChart
  type="themeRiver"
  data={[
    ["2026/05/01", 10, "Organic"],
    ["2026/05/02", 15, "Organic"],
  ]}
  dataFormat="native"
  options={{ singleAxis: { type: "time" } }}
/>`,
  },
  pictorialBar: {
    type: "pictorialBar",
    dataDescription: "`data`: `[[name, value], ...]` 형태의 TOP 데이터입니다.",
    recommendedProps: ["`dataFormat`: `top`", "`seriesOptions`: `symbol`, `symbolRepeat`, `symbolSize`"],
    officialDocs: [seriesDoc("pictorialBar")],
    exampleCode: `<GenericChart
  type="pictorialBar"
  data={[
    ["Alpha", 120],
    ["Beta", 96],
  ]}
  dataFormat="top"
  seriesOptions={{ symbol: "rect", symbolRepeat: true }}
/>`,
  },
  custom: {
    type: "custom",
    dataDescription: "`data`: `renderItem`이 해석할 수 있는 사용자 정의 series data입니다.",
    recommendedProps: ["`dataFormat`: `native`"],
    requiredEchartsSettings: [
      { prop: "series", code: "series[].renderItem", description: "custom series가 그릴 graphic element를 반환합니다." },
    ],
    officialDocs: [seriesDoc("custom")],
    exampleCode: `<GenericChart
  type="custom"
  data={customSeriesData}
  dataFormat="native"
  series={[{ renderItem }]}
/>`,
  },
  wordCloud: {
    type: "wordCloud",
    dataDescription: "`data`: `[[name, value], ...]` 형태의 TOP 키워드 데이터입니다.",
    recommendedProps: ["`dataFormat`: `top`"],
    officialDocs: [{ label: "echarts-wordcloud", url: officialSeriesDocs.wordCloud }],
    exampleCode: topExample("wordCloud"),
  },
};

function buildRequiredPropsMarkdown(definition: ChartDocDefinition) {
  const requiredSettings = definition.requiredEchartsSettings?.map(
    (item) => `- \`${item.prop}\` / \`${item.code}\`: ${item.description}`,
  ) ?? [];

  return [
    "## 필수 설정",
    "",
    `- \`type\`: \`${definition.type}\``,
    `- ${definition.dataDescription}`,
    ...requiredSettings,
  ].join("\n");
}

function buildRecommendedPropsMarkdown(definition: ChartDocDefinition) {
  if (!definition.recommendedProps?.length) {
    return "";
  }

  return [
    "## Recommended Props",
    "",
    ...definition.recommendedProps.map((item) => `- ${item}`),
  ].join("\n");
}

function buildCommonOptionsMarkdown() {
  return [
    "## Common Options",
    "",
    "- `legend`: `boolean | object`로 범례 표시를 제어합니다. `bar`, `pictorialBar`, `treemap`, `gauge`, `sankey`, `heatmap`, `funnel`, `sunburst`, `wordCloud`와 `TopChart`의 `bar`/`column`/`treemap` mode는 기본 숨김이며, `pie`는 기본 표시입니다. 데이터 범례 차트는 표시 시 scroll/ellipsis 기본값을 적용합니다. 우측 세로 legend와 차트 영역 축소 기본값은 우선 `pie`에 적용합니다.",
    "- Visible `legend`는 기본 `icon: \"circle\"`을 사용합니다.",
    "- `tooltip`: `boolean | object`로 툴팁 표시를 제어합니다.",
    "- TOP single-series tooltip은 기본 formatter에서 `Item N` 라벨을 사용합니다.",
    "- `colors`: `string[]`로 series 또는 item 색상을 고정합니다. 비어 있으면 KMSF mint 계열 TOP 10 palette를 사용합니다.",
    "- `seriesOptions`: KMSF가 생성한 series의 일부 속성을 덮어씁니다.",
    "- `options.title.text` 또는 `options.title.subtext`가 있으면 grid top 기본값을 확장합니다. 사용자 `options.grid`가 최종 우선합니다.",
    "- `pie`와 `funnel`은 기본 label을 숨깁니다.",
    "- `loadingFallback`: 차트 최초 렌더링 전 또는 wordCloud 확장 로딩 중 표시할 ReactNode입니다. shadcn Skeleton을 전달하는 방식으로 사용합니다.",
    "- `options`: ECharts 공식 option 구조를 그대로 전달합니다.",
    "- 필수 설정 누락 시 차트 영역에 fallback을 표시하고 `[KMSF Charts]` console error를 1회 기록합니다.",
  ].join("\n");
}

function buildOfficialDocsMarkdown(definition: ChartDocDefinition) {
  return [
    "## Official Docs",
    "",
    ...definition.officialDocs.map((item) => `- [${item.label}](${item.url})`),
  ].join("\n");
}

function compactSections(sections: string[]) {
  return sections.filter(Boolean).join("\n\n");
}

function buildMarkdown(type: KmsfChartType) {
  const sample = chartSamples.find((item) => item.type === type);
  const definition = chartDocDefinitions[type];
  const disabledNote = sample?.disabledReason ? `## Note\n\n- ${sample.disabledReason}` : "";

  return compactSections([
    `# ${type}`,
    sample?.summary ?? "ECharts native chart",
    buildRequiredPropsMarkdown(definition),
    buildRecommendedPropsMarkdown(definition),
    buildCommonOptionsMarkdown(),
    `## Example\n\n\`\`\`tsx\n${definition.exampleCode}\n\`\`\``,
    buildOfficialDocsMarkdown(definition),
    disabledNote,
  ]);
}

function resolveDocCategory(sample: ChartSample, definition: ChartDocDefinition): ChartDocCategory {
  if (sample.category === "Advanced") {
    return "advanced";
  }

  if (definition.requiredEchartsSettings?.length) {
    return "native-required";
  }

  return "easy";
}

export const chartDocs: ChartDoc[] = chartSamples.map((sample) => {
  const definition = chartDocDefinitions[sample.type];
  const category = resolveDocCategory(sample, definition);
  const markdown = buildMarkdown(sample.type);
  const settingsText = definition.requiredEchartsSettings
    ?.map((item) => `${item.prop} ${item.code} ${item.description}`)
    .join(" ");
  const docsText = definition.officialDocs.map((item) => `${item.label} ${item.url}`).join(" ");

  return {
    category,
    markdown,
    officialDocs: definition.officialDocs,
    officialDocsUrl: definition.officialDocs[0]?.url ?? officialSeriesDocs[sample.type],
    searchText: [
      sample.type,
      sample.category,
      sample.summary,
      sample.dataFormat,
      category,
      sample.disabledReason,
      settingsText,
      docsText,
      "data",
      "options",
      "series",
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
