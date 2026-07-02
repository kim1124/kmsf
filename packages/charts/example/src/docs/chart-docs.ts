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

export interface ChartApiEntry {
  code: string;
  description: string;
}

export interface ChartApiSection {
  entries: ChartApiEntry[];
  id: string;
  title: "KMSF Props" | "ECharts Options" | "SeriesOptions" | "Methods/Utilities";
}

export interface ChartApiDoc {
  exampleCode: string;
  id: string;
  liveExamplePath: string;
  sections: ChartApiSection[];
  title: string;
  type: KmsfChartType;
}

export interface ChartApiFeatureEntry {
  chartType?: KmsfChartType;
  description: string;
  detail?: string;
  name: string;
  type: string;
}

export interface ChartApiFeatureMethod {
  description: string;
  name: string;
  params: string;
  returns: string;
}

export interface ChartApiFeatureSample {
  code: string;
  language: "ts" | "tsx";
  title: string;
}

export interface ChartApiFeatureLiveLink {
  label: string;
  path: string;
  type: KmsfChartType;
}

export interface ChartApiFeatureDoc {
  id: string;
  liveLinks: ChartApiFeatureLiveLink[];
  methods?: ChartApiFeatureMethod[];
  options: ChartApiFeatureEntry[];
  props: ChartApiFeatureEntry[];
  samples: ChartApiFeatureSample[];
  summary: string;
  title: string;
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
    "- 필수 설정 누락 시 차트 영역에 fallback을 표시하며 browser console warning/error를 발생시키지 않습니다.",
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

function chartApiId(type: KmsfChartType, section: string) {
  return `${type}-${section}`;
}

function buildApiSections(sample: ChartSample, definition: ChartDocDefinition): ChartApiSection[] {
  const kmsfProps: ChartApiEntry[] = [
    { code: "type", description: `GenericChart chart type. 이 페이지에서는 ${definition.type}를 사용합니다.` },
    { code: "data", description: definition.dataDescription.replaceAll("`", "") },
    { code: "dataFormat", description: definition.recommendedProps?.find((item) => item.includes("dataFormat"))?.replaceAll("`", "") ?? "native, trend, top 중 데이터 해석 방식을 지정합니다." },
    { code: "options", description: "ECharts 공식 option을 그대로 전달합니다. 사용자 options가 내부 기본값보다 우선합니다." },
    { code: "series", description: "ECharts series 배열을 직접 전달해야 하는 native chart에서 사용합니다." },
    { code: "seriesOptions", description: "KMSF가 생성한 series 또는 직접 전달한 series의 속성을 부분 덮어쓰기 합니다." },
    { code: "colors", description: "series 또는 item 색상 배열입니다. 비어 있으면 KMSF mint 계열 기본 palette를 사용합니다." },
    { code: "legend / tooltip", description: "boolean 또는 object로 legend, tooltip 표시와 ECharts 세부 옵션을 제어합니다." },
  ];
  const requiredOptions = definition.requiredEchartsSettings?.filter((item) => item.prop === "options") ?? [];
  const requiredSeries = definition.requiredEchartsSettings?.filter((item) => item.prop === "series") ?? [];
  const requiredSeriesOptions = definition.requiredEchartsSettings?.filter((item) => item.prop === "seriesOptions") ?? [];
  const echartsOptions: ChartApiEntry[] = [
    ...requiredOptions.map((item) => ({ code: item.code, description: item.description })),
    { code: "legend", description: "legend 표시, 위치, scroll, icon을 제어합니다. 사용자 options.legend가 최종 우선합니다." },
    { code: "tooltip", description: "tooltip 표시, formatter, position을 제어합니다. 사용자 options.tooltip이 최종 우선합니다." },
    { code: "grid / title", description: "title, subtitle, legend와 차트 영역이 겹치지 않도록 layout을 조정할 때 사용합니다." },
  ];
  const seriesOptions: ChartApiEntry[] = [
    ...requiredSeriesOptions.map((item) => ({ code: item.code, description: item.description })),
    ...requiredSeries.map((item) => ({ code: item.code, description: item.description })),
    { code: "seriesOptions", description: `${sample.type} series에 전달할 ECharts series option 부분값입니다.` },
    { code: "seriesOptions.label", description: "series label 표시, overflow, formatter를 제어합니다." },
    { code: "seriesOptions.itemStyle / lineStyle", description: "series item 또는 line 스타일을 조정합니다." },
  ];

  return [
    {
      entries: kmsfProps,
      id: chartApiId(sample.type, "kmsf-props"),
      title: "KMSF Props",
    },
    {
      entries: echartsOptions,
      id: chartApiId(sample.type, "echarts-options"),
      title: "ECharts Options",
    },
    {
      entries: seriesOptions,
      id: chartApiId(sample.type, "seriesoptions"),
      title: "SeriesOptions",
    },
    {
      entries: [
        { code: "onChartReady", description: "ECharts instance가 준비되면 호출되는 callback입니다." },
        { code: "getInstance", description: "forwarded handle에서 현재 ECharts instance를 조회합니다." },
        { code: "setOption", description: "forwarded handle에서 ECharts option을 직접 갱신합니다." },
      ],
      id: chartApiId(sample.type, "methods-utilities"),
      title: "Methods/Utilities",
    },
  ];
}

export const chartApiDocs: ChartApiDoc[] = chartSamples.map((sample) => {
  const definition = chartDocDefinitions[sample.type];

  return {
    exampleCode: definition.exampleCode,
    id: `api-${sample.type}`,
    liveExamplePath: `/examples/${sample.type}#${sample.type}-live-update`,
    sections: buildApiSections(sample, definition),
    title: sample.type,
    type: sample.type,
  };
});

const visibleChartSamples = chartSamples.filter((sample) => sample.type !== "custom" && sample.type !== "map");

const nativeRequiredEntries: ChartApiFeatureEntry[] = visibleChartSamples.flatMap((sample) => {
  const definition = chartDocDefinitions[sample.type];

  return (definition.requiredEchartsSettings ?? []).map((setting) => ({
    chartType: sample.type,
    description: setting.description,
    detail: `${sample.type} 차트는 이 설정이 없으면 fallback UI로 보호됩니다.`,
    name: `${sample.type}: ${setting.code}`,
    type: setting.prop,
  }));
});

const nativeSampleTypes: KmsfChartType[] = ["radar", "heatmap", "sankey", "themeRiver"];

const nativeRequiredSamples: ChartApiFeatureSample[] = nativeSampleTypes.map((type) => ({
  code: chartDocDefinitions[type].exampleCode,
  language: "tsx",
  title: `${type} native 설정 예제`,
}));

export const chartApiFeatureDocs: ChartApiFeatureDoc[] = [
  {
    id: "api-generic-rendering",
    title: "GenericChart 렌더링",
    summary: "GenericChart가 chart type, data, ECharts option을 조합해 가장 넓은 chart surface를 렌더링하는 기본 계약입니다.",
    props: [
      {
        name: "type",
        type: "KmsfChartType",
        description: "ECharts series type과 KMSF data normalization 경로를 결정합니다.",
        detail: "map, custom은 현재 playground 예제에서 제외합니다.",
      },
      {
        name: "data",
        type: "unknown",
        description: "차트에 표시할 원본 데이터입니다.",
        detail: "top, trend, native dataFormat에 따라 해석 방식이 달라집니다.",
      },
      {
        name: "dataFormat",
        type: "top | trend | native",
        description: "KMSF가 data를 series로 변환할 방식을 지정합니다.",
        detail: "생략 시 chart type 기준으로 가능한 기본값을 사용합니다.",
      },
      {
        name: "series",
        type: "SeriesOption[]",
        description: "ECharts series를 직접 전달할 때 사용합니다.",
        detail: "graph, sankey처럼 link/render 설정이 필요한 native chart에서 주로 사용합니다.",
      },
      {
        name: "seriesOptions",
        type: "SeriesOverride",
        description: "KMSF가 생성한 series에 부분 option을 덮어씁니다.",
        detail: "사용자 seriesOptions가 내부 기본값보다 우선합니다.",
      },
    ],
    options: [
      {
        name: "options",
        type: "EChartsOption",
        description: "ECharts 공식 option shape를 그대로 전달합니다.",
        detail: "사용자 options가 내부 기본값보다 우선합니다.",
      },
      {
        name: "options.grid / options.title",
        type: "EChartsOption",
        description: "title, subtitle, legend와 chart 영역이 겹치지 않도록 layout을 조정합니다.",
      },
      {
        name: "xAxis / yAxis",
        type: "Axis option",
        description: "cartesian chart의 축 option을 직접 지정합니다.",
      },
    ],
    methods: [
      {
        name: "onChartReady",
        params: "chart: ECharts",
        returns: "void",
        description: "ECharts instance가 준비되면 호출되는 callback입니다.",
      },
    ],
    samples: [{ code: chartDocDefinitions.bar.exampleCode, language: "tsx", title: "GenericChart 기본 예제" }],
    liveLinks: [{ label: "GenericChart 라이브 예제", path: "/examples/generic-chart", type: "bar" }],
  },
  {
    id: "api-trend-top-data",
    title: "Trend / Top 데이터",
    summary: "사용자가 쉽게 입력할 수 있는 trend tuple과 top tuple을 wrapper chart 또는 GenericChart에서 사용하는 계약입니다.",
    props: [
      {
        chartType: "line",
        name: "TrendChart.data",
        type: "TrendChartRow[]",
        description: "[time, value, ...] row를 추이 series로 변환합니다.",
        detail: "time은 문자열 또는 Date를 사용할 수 있습니다.",
      },
      {
        chartType: "line",
        name: "TrendChart.series",
        type: "SeriesOption[]",
        description: "TrendChart에서 각 value column을 어떤 series로 표시할지 정의합니다.",
        detail: "TrendChart에서는 series가 필수입니다.",
      },
      {
        chartType: "bar",
        name: "TopChart.data",
        type: "TopChartRow[]",
        description: "[name, value, ...] row를 TOP chart series로 변환합니다.",
      },
      {
        chartType: "bar",
        name: "TopChart.mode",
        type: "bar | column | pie | treemap",
        description: "TOP 데이터를 어떤 chart 형태로 표현할지 지정합니다.",
      },
    ],
    options: [
      {
        name: "legend",
        type: "boolean | object",
        description: "Trend/Top wrapper에서 범례 표시와 ECharts legend option을 제어합니다.",
      },
      {
        name: "tooltip",
        type: "boolean | object",
        description: "Trend/Top wrapper에서 tooltip 표시와 formatter를 제어합니다.",
      },
      {
        name: "seriesOptions",
        type: "SeriesOverride",
        description: "line smooth, barWidth, pie label 같은 series option을 override합니다.",
      },
    ],
    samples: [
      {
        code: `import { TopChart, TrendChart, createTopRows, createTrendRows } from "@kmsf/charts";

const trendRows = createTrendRows([
  { x: "2026-07-02 10:00:00", value: 120 },
  { x: "2026-07-02 10:01:00", value: 132 },
]);

const topRows = createTopRows([
  { name: "Alpha", value: 120 },
  { name: "Beta", value: 96 },
]);

export function DashboardCharts() {
  return (
    <>
      <TrendChart data={trendRows} series={[{ id: "sales", name: "Sales" }]} />
      <TopChart data={topRows} mode="bar" />
    </>
  );
}`,
        language: "tsx",
        title: "Trend / Top wrapper 예제",
      },
    ],
    liveLinks: [
      { label: "Trend 라이브 예제", path: "/examples/trend", type: "line" },
      { label: "Top 라이브 예제", path: "/examples/top", type: "bar" },
    ],
  },
  {
    id: "api-native-required-options",
    title: "Native 필수 옵션",
    summary: "ECharts native option 없이는 의미 있게 렌더링할 수 없는 chart의 필수 설정을 기능 단위로 모았습니다.",
    props: [
      {
        name: "dataFormat",
        type: "native",
        description: "ECharts native data shape를 그대로 사용할 때 지정합니다.",
        detail: "chart별 필수 options 또는 series 설정이 없으면 chart-local fallback을 표시합니다.",
      },
      {
        name: "series",
        type: "SeriesOption[]",
        description: "links, renderItem, coordinateSystem처럼 native series 필수 설정을 직접 전달합니다.",
      },
    ],
    options: nativeRequiredEntries,
    samples: nativeRequiredSamples,
    liveLinks: [
      { label: "Radar 라이브 예제", path: "/examples/radar#radar-live-update", type: "radar" },
      { label: "Heatmap 라이브 예제", path: "/examples/heatmap#heatmap-live-update", type: "heatmap" },
      { label: "Sankey 라이브 예제", path: "/examples/sankey#sankey-live-update", type: "sankey" },
      { label: "Theme River 라이브 예제", path: "/examples/themeRiver#themeRiver-live-update", type: "themeRiver" },
    ],
  },
  {
    id: "api-legend-tooltip-theme",
    title: "Legend / Tooltip / Theme",
    summary: "범례, 툴팁, 색상, theme override처럼 모든 chart에서 자주 조정하는 표시 옵션입니다.",
    props: [
      {
        name: "legend",
        type: "boolean | LegendComponentOption",
        description: "legend 표시 여부 또는 ECharts legend option입니다.",
        detail: "pie는 기본 표시, 다수 TOP/native chart는 기본 숨김으로 시작합니다.",
      },
      {
        name: "tooltip",
        type: "boolean | TooltipComponentOption",
        description: "tooltip 표시 여부 또는 ECharts tooltip option입니다.",
      },
      {
        name: "colors",
        type: "string[]",
        description: "series 또는 item palette입니다.",
        detail: "비어 있으면 KMSF mint 계열 기본 palette를 사용합니다.",
      },
      {
        name: "themeOverrides",
        type: "KmsfChartThemeOverrides",
        description: "palette, textColor, fontFamily, backgroundColor를 package theme 위에 덮어씁니다.",
      },
    ],
    options: [
      {
        name: "options.legend",
        type: "LegendComponentOption",
        description: "legend type, orient, icon, width, formatter, scroll을 직접 제어합니다.",
      },
      {
        name: "options.tooltip",
        type: "TooltipComponentOption",
        description: "tooltip trigger, position, formatter를 직접 제어합니다.",
      },
      {
        name: "seriesOptions.label",
        type: "SeriesOption",
        description: "pie, funnel, sunburst 등 label 표시와 overflow 정책을 조정합니다.",
      },
    ],
    samples: [{ code: chartDocDefinitions.pie.exampleCode, language: "tsx", title: "Legend / Tooltip 예제" }],
    liveLinks: [
      { label: "Theme 라이브 예제", path: "/examples/theme", type: "bar" },
      { label: "Pie 라이브 예제", path: "/examples/pie#pie-live-update", type: "pie" },
    ],
  },
  {
    id: "api-lifecycle-methods",
    title: "Lifecycle / Methods",
    summary: "차트 생성, resize, loading fallback, imperative handle 같은 runtime lifecycle 계약입니다.",
    props: [
      {
        name: "height / className / style",
        type: "layout props",
        description: "chart container의 높이와 외부 styling hook을 지정합니다.",
      },
      {
        name: "loadingFallback",
        type: "ReactNode",
        description: "초기 ECharts instance 생성 전 또는 wordCloud 확장 로딩 중 표시할 fallback입니다.",
      },
      {
        name: "theme",
        type: "KmsfChartTheme",
        description: "ECharts init theme 이름입니다.",
      },
    ],
    options: [
      {
        name: "ResizeObserver",
        type: "internal lifecycle",
        description: "container resize를 requestAnimationFrame 단위로 chart.resize에 연결합니다.",
      },
      {
        name: "replaceMerge",
        type: "setOption strategy",
        description: "series identity가 호환되지 않을 때만 series replaceMerge를 사용합니다.",
      },
    ],
    methods: [
      {
        name: "getInstance",
        params: "없음",
        returns: "ECharts | null",
        description: "forwarded handle에서 현재 ECharts instance를 조회합니다.",
      },
      {
        name: "setOption",
        params: "option: EChartsOption",
        returns: "void",
        description: "forwarded handle에서 ECharts option을 직접 갱신합니다.",
      },
      {
        name: "onChartReady",
        params: "chart: ECharts",
        returns: "void",
        description: "instance 준비 직후 외부 초기화가 필요할 때 사용합니다.",
      },
    ],
    samples: [
      {
        code: `const chartRef = useRef<KmsfChartHandle>(null);

chartRef.current?.setOption({
  dataZoom: [{ type: "inside" }],
});`,
        language: "tsx",
        title: "Imperative method 예제",
      },
    ],
    liveLinks: [{ label: "Large Data 라이브 예제", path: "/performance/large-data", type: "line" }],
  },
];

export function getChartApiDoc(type: KmsfChartType) {
  return chartApiDocs.find((doc) => doc.type === type) ?? chartApiDocs[0]!;
}

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
