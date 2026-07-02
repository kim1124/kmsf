import type { EChartsOption, SeriesOption } from "echarts";

import type { GenericChartDataFormat, KmsfChartType } from "../../../src";
import { getExamplePalette } from "./chart-colors";

export type OfficialFixtureSection = "Basic" | "Advanced";

export interface OfficialChartFixture {
  colors?: string[];
  data: unknown;
  dataFormat?: GenericChartDataFormat;
  editableData: boolean;
  live?: boolean;
  mixedSeries?: boolean;
  officialExampleId: string;
  officialUrl: string;
  options?: EChartsOption;
  section: OfficialFixtureSection;
  series?: SeriesOption[];
  seriesOptions?: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  summary: string;
  title: string;
  type: Exclude<KmsfChartType, "custom" | "map">;
}

export const officialExcludedChartTypes = ["custom", "map"] as const;

const officialUrl = (id: string) => `https://echarts.apache.org/examples/en/editor.html?c=${id}`;
const colors = getExamplePalette();
const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const officialTreeData = [
  {
    name: "flare",
    children: [
      { name: "analytics", children: [{ name: "cluster", value: 3938 }, { name: "graph", value: 3812 }] },
      { name: "display", children: [{ name: "DirtySprite", value: 8833 }, { name: "LineSprite", value: 1732 }] },
    ],
  },
];

export const officialLinesData = [
  { coords: [[116.46, 39.92], [121.48, 31.22]] },
  { coords: [[116.46, 39.92], [113.23, 23.16]] },
  { coords: [[121.48, 31.22], [114.31, 30.52]] },
];

const scatterData = [
  [10.0, 8.04],
  [8.07, 6.95],
  [13.0, 7.58],
  [9.05, 8.81],
  [11.0, 8.33],
  [14.0, 7.66],
  [13.4, 6.81],
  [10.0, 6.33],
  [14.0, 8.96],
  [12.5, 6.82],
  [9.15, 7.2],
  [11.5, 7.2],
  [3.03, 4.23],
  [12.2, 7.83],
  [2.02, 4.47],
  [1.05, 3.33],
];

const heatmapHours = ["12a", "2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p"];
const heatmapDays = ["Saturday", "Friday", "Thursday", "Wednesday", "Tuesday", "Monday", "Sunday"];
const heatmapData = heatmapDays.flatMap((_, dayIndex) =>
  heatmapHours.map((__, hourIndex) => [hourIndex, dayIndex, (dayIndex * 7 + hourIndex * 3) % 12 || "-"]),
);

const sunburstData = [
  {
    name: "Grandpa",
    children: [
      {
        name: "Uncle Leo",
        value: 15,
        children: [{ name: "Cousin Jack", value: 2 }, { name: "Cousin Mary", value: 5 }],
      },
      {
        name: "Father",
        value: 10,
        children: [{ name: "Me", value: 5 }, { name: "Brother Peter", value: 1 }],
      },
    ],
  },
  {
    name: "Nancy",
    children: [{ name: "Uncle Nike", children: [{ name: "Cousin Betty", value: 1 }, { name: "Cousin Jenny", value: 2 }] }],
  },
];

const graphNodes = [
  { name: "Node 1", x: 300, y: 300 },
  { name: "Node 2", x: 800, y: 300 },
  { name: "Node 3", x: 550, y: 100 },
  { name: "Node 4", x: 550, y: 500 },
];

const graphLinks = [
  { source: 0, target: 1, lineStyle: { curveness: 0.2, width: 5 } },
  { source: "Node 2", target: "Node 1", lineStyle: { curveness: 0.2 } },
  { source: "Node 1", target: "Node 3" },
  { source: "Node 2", target: "Node 3" },
  { source: "Node 2", target: "Node 4" },
  { source: "Node 1", target: "Node 4" },
];

const sankeyNodes = ["a", "b", "a1", "a2", "b1", "c"].map((name) => ({ name }));
const sankeyLinks = [
  { source: "a", target: "a1", value: 5 },
  { source: "a", target: "a2", value: 3 },
  { source: "b", target: "b1", value: 8 },
  { source: "a", target: "b1", value: 3 },
  { source: "b1", target: "a1", value: 1 },
  { source: "b1", target: "c", value: 2 },
];

const themeRiverData = ["DQ", "TY", "SS", "QG"].flatMap((name, categoryIndex) =>
  Array.from({ length: 10 }, (_, index) => [`2015/11/${String(index + 8).padStart(2, "0")}`, 8 + ((index + 1) * (categoryIndex + 2)) % 34, name]),
);

const wordCloudData = [
  ["Apache", 120],
  ["ECharts", 108],
  ["KMSF", 96],
  ["Chart", 82],
  ["React", 74],
  ["Tooltip", 66],
  ["Legend", 58],
  ["Dataset", 52],
  ["Series", 46],
  ["Option", 40],
];

type NativeFixtureInput = Omit<OfficialChartFixture, "dataFormat" | "editableData" | "officialUrl" | "section"> & {
  officialUrl?: string;
  section?: OfficialFixtureSection;
};

function nativeFixture(input: NativeFixtureInput): OfficialChartFixture {
  return {
    ...input,
    dataFormat: "native",
    editableData: input.live ? false : true,
    officialUrl: input.officialUrl ?? officialUrl(input.officialExampleId),
    section: input.section ?? "Basic",
  };
}

export const officialChartFixtures: OfficialChartFixture[] = [
  nativeFixture({
    colors,
    data: [],
    live: true,
    officialExampleId: "line-simple",
    options: { xAxis: { data: weekLabels, type: "category" }, yAxis: { type: "value" } },
    series: [{ data: [150, 230, 224, 218, 135, 147, 260], type: "line" }],
    summary: "공식 Basic Line Chart 예제와 같은 category axis 기반 라인 차트입니다.",
    title: "Basic Line Chart",
    type: "line",
  }),
  nativeFixture({
    colors,
    data: [],
    officialExampleId: "bar-simple",
    options: { xAxis: { data: weekLabels, type: "category" }, yAxis: { type: "value" } },
    series: [{ data: [120, 200, 150, 80, 70, 110, 130], type: "bar" }],
    summary: "공식 Basic Bar 예제와 같은 요일별 막대 차트입니다.",
    title: "Basic Bar",
    type: "bar",
  }),
  nativeFixture({
    colors,
    data: [],
    officialExampleId: "pie-simple",
    options: { legend: { left: "left", orient: "vertical" }, tooltip: { trigger: "item" } },
    series: [{
      data: [
        { name: "Search Engine", value: 1048 },
        { name: "Direct", value: 735 },
        { name: "Email", value: 580 },
        { name: "Union Ads", value: 484 },
        { name: "Video Ads", value: 300 },
      ],
      name: "Access From",
      radius: "50%",
      type: "pie",
    }],
    summary: "공식 Referer of a Website 예제와 같은 유입 경로 파이 차트입니다.",
    title: "Referer of a Website",
    type: "pie",
  }),
  nativeFixture({
    colors,
    data: [],
    officialExampleId: "scatter-simple",
    options: { xAxis: {}, yAxis: {} },
    series: [{ data: scatterData, symbolSize: 20, type: "scatter" }],
    summary: "공식 Basic Scatter Chart 예제와 같은 X/Y 분포 차트입니다.",
    title: "Basic Scatter Chart",
    type: "scatter",
  }),
  nativeFixture({
    colors,
    data: [],
    officialExampleId: "scatter-effect",
    options: { xAxis: { scale: true }, yAxis: { scale: true } },
    series: [
      { data: [[172.7, 105.2], [153.4, 42]], symbolSize: 20, type: "effectScatter" },
      { data: scatterData, type: "effectScatter" },
    ],
    summary: "공식 Effect Scatter Chart 예제처럼 강조 지점과 일반 분포를 함께 보여줍니다.",
    title: "Effect Scatter Chart",
    type: "effectScatter",
  }),
  nativeFixture({
    data: [[20, 34, 10, 38], [40, 35, 30, 50], [31, 38, 33, 44], [38, 15, 5, 42]],
    officialExampleId: "candlestick-simple",
    options: { xAxis: { data: ["2017-10-24", "2017-10-25", "2017-10-26", "2017-10-27"] }, yAxis: {} },
    summary: "공식 Basic Candlestick 예제와 같은 OHLC 데이터입니다.",
    title: "Basic Candlestick",
    type: "candlestick",
  }),
  nativeFixture({
    data: [],
    officialExampleId: "radar",
    options: {
      legend: { data: ["Allocated Budget", "Actual Spending"] },
      radar: {
        indicator: [
          { max: 100, name: "Sales" },
          { max: 100, name: "Administration" },
          { max: 100, name: "Information Technology" },
          { max: 100, name: "Customer Support" },
          { max: 100, name: "Development" },
          { max: 100, name: "Marketing" },
        ],
      },
    },
    series: [{
      data: [
        { name: "Allocated Budget", value: [65, 19, 67, 92, 96, 72] },
        { name: "Actual Spending", value: [77, 88, 93, 68, 81, 84] },
      ],
      name: "Budget vs spending",
      type: "radar",
    }],
    summary: "공식 Basic Radar Chart 예제와 같은 예산 비교 레이더입니다.",
    title: "Basic Radar Chart",
    type: "radar",
  }),
  nativeFixture({
    data: heatmapData,
    officialExampleId: "heatmap-cartesian",
    options: {
      grid: { height: "50%", top: "10%" },
      tooltip: { position: "top" },
      visualMap: { bottom: "15%", calculable: true, left: "center", max: 10, min: 0, orient: "horizontal" },
      xAxis: { data: heatmapHours, splitArea: { show: true }, type: "category" },
      yAxis: { data: heatmapDays, splitArea: { show: true }, type: "category" },
    },
    summary: "공식 Heatmap on Cartesian 예제처럼 시간과 요일 교차값을 색으로 표현합니다.",
    title: "Heatmap on Cartesian",
    type: "heatmap",
  }),
  nativeFixture({
    data: officialTreeData,
    officialExampleId: "tree-basic",
    seriesOptions: {
      animationDuration: 550,
      animationDurationUpdate: 750,
      bottom: "1%",
      expandAndCollapse: true,
      left: "7%",
      right: "20%",
      top: "1%",
    },
    summary: "공식 From Left to Right Tree 예제의 축약 로컬 계층 데이터입니다.",
    title: "From Left to Right Tree",
    type: "tree",
  }),
  nativeFixture({
    data: [
      { children: [{ name: "nodeAa", value: 4 }, { name: "nodeAb", value: 6 }], name: "nodeA", value: 10 },
      { children: [{ children: [{ name: "nodeBa1", value: 20 }], name: "nodeBa", value: 20 }], name: "nodeB", value: 20 },
    ],
    officialExampleId: "treemap-simple",
    summary: "공식 Basic Treemap 예제와 같은 계층 면적 차트입니다.",
    title: "Basic Treemap",
    type: "treemap",
  }),
  nativeFixture({
    data: sunburstData,
    officialExampleId: "sunburst-simple",
    seriesOptions: { label: { show: false }, radius: [0, "90%"] },
    summary: "공식 Basic Sunburst 예제의 계층 데이터를 사용하되 라벨은 기본 숨김입니다.",
    title: "Basic Sunburst",
    type: "sunburst",
  }),
  nativeFixture({
    data: officialLinesData,
    officialExampleId: "lines-airline",
    options: { xAxis: { max: 130, min: 100, type: "value" }, yAxis: { max: 45, min: 20, type: "value" } },
    seriesOptions: { coordinateSystem: "cartesian2d", lineStyle: { curveness: 0.3, opacity: 0.2, width: 1 } },
    summary: "공식 65k+ Airline 예제를 geo 의존성 없이 축약한 좌표 흐름 차트입니다.",
    title: "Airline Routes",
    type: "lines",
  }),
  nativeFixture({
    data: graphNodes,
    officialExampleId: "graph-simple",
    series: [{
      data: graphNodes,
      edgeSymbol: ["circle", "arrow"],
      edgeSymbolSize: [4, 10],
      label: { show: true },
      layout: "none",
      links: graphLinks,
      roam: true,
      symbolSize: 50,
      type: "graph",
    }],
    summary: "공식 Simple Graph 예제처럼 노드와 방향 링크를 함께 표시합니다.",
    title: "Simple Graph",
    type: "graph",
  }),
  nativeFixture({
    data: [[850, 740, 900, 1070, 930], [960, 940, 960, 940, 880], [880, 880, 880, 860, 720]],
    officialExampleId: "boxplot-light-velocity",
    options: { xAxis: { data: ["expr 0", "expr 1", "expr 2"], type: "category" }, yAxis: { type: "value" } },
    summary: "공식 Boxplot Light Velocity 예제를 transform 없이 축약한 박스플롯입니다.",
    title: "Boxplot Light Velocity",
    type: "boxplot",
  }),
  nativeFixture({
    data: [[12.99, 100, 82, "Good"], [9.99, 80, 77, "OK"], [20, 120, 60, "Excellent"]],
    officialExampleId: "parallel-simple",
    options: {
      parallelAxis: [
        { dim: 0, name: "Price" },
        { dim: 1, name: "Net Weight" },
        { dim: 2, name: "Amount" },
        { data: ["Excellent", "Good", "OK", "Bad"], dim: 3, name: "Score", type: "category" },
      ],
    },
    seriesOptions: { lineStyle: { width: 4 } },
    summary: "공식 Basic Parallel 예제와 같은 네 축 평행좌표입니다.",
    title: "Basic Parallel",
    type: "parallel",
  }),
  nativeFixture({
    data: [],
    officialExampleId: "gauge-simple",
    options: { tooltip: { formatter: "{a} <br/>{b} : {c}%" } },
    series: [{
      data: [{ name: "SCORE", value: 50 }],
      detail: { formatter: "{value}", valueAnimation: true },
      name: "Pressure",
      progress: { show: true },
      type: "gauge",
    }],
    summary: "공식 Simple Gauge 예제와 같은 단일 점수 게이지입니다.",
    title: "Simple Gauge",
    type: "gauge",
  }),
  nativeFixture({
    data: [],
    officialExampleId: "funnel",
    options: { legend: { data: ["Show", "Click", "Visit", "Inquiry", "Order"] }, tooltip: { formatter: "{a} <br/>{b} : {c}%", trigger: "item" } },
    series: [{
      data: [{ name: "Visit", value: 60 }, { name: "Inquiry", value: 40 }, { name: "Order", value: 20 }, { name: "Click", value: 80 }, { name: "Show", value: 100 }],
      gap: 2,
      label: { position: "inside", show: true },
      max: 100,
      min: 0,
      name: "Funnel",
      type: "funnel",
    }],
    summary: "공식 Funnel Chart 예제와 같은 단계별 전환 차트입니다.",
    title: "Funnel Chart",
    type: "funnel",
  }),
  nativeFixture({
    data: sankeyNodes,
    officialExampleId: "sankey-simple",
    series: [{ data: sankeyNodes, emphasis: { focus: "adjacency" }, links: sankeyLinks, type: "sankey" }],
    summary: "공식 Basic Sankey 예제와 같은 노드 흐름 차트입니다.",
    title: "Basic Sankey",
    type: "sankey",
  }),
  nativeFixture({
    data: themeRiverData,
    officialExampleId: "themeRiver-basic",
    options: {
      legend: { data: ["DQ", "TY", "SS", "QG"], top: 15 },
      singleAxis: { bottom: 50, top: 50, type: "time" },
      tooltip: { trigger: "axis" },
    },
    summary: "공식 ThemeRiver 예제의 축약 시간 흐름 데이터입니다.",
    title: "ThemeRiver",
    type: "themeRiver",
  }),
  nativeFixture({
    colors,
    data: [],
    mixedSeries: true,
    officialExampleId: "pictorialBar-dotted",
    options: { legend: { data: ["line", "bar"] }, xAxis: { data: weekLabels }, yAxis: { splitLine: { show: false } } },
    section: "Advanced",
    series: [
      { data: [220, 182, 191, 234, 290, 330, 310], name: "line", smooth: true, type: "line" },
      { barWidth: 10, data: [120, 132, 101, 134, 90, 230, 210], name: "bar", type: "bar" },
      { data: [220, 182, 191, 234, 290, 330, 310], name: "dotted", symbol: "rect", symbolRepeat: true, symbolSize: [12, 4], type: "pictorialBar" },
    ],
    summary: "공식 Dotted bar 예제처럼 line/bar/pictorialBar를 함께 쓰는 고급 예제입니다.",
    title: "Dotted Bar",
    type: "pictorialBar",
  }),
  {
    colors,
    data: wordCloudData,
    dataFormat: "top",
    editableData: true,
    officialExampleId: "kmsf-wordcloud-extension",
    officialUrl: "https://github.com/ecomfe/echarts-wordcloud",
    section: "Basic",
    seriesOptions: {
      animationDuration: 300,
      animationDurationUpdate: 700,
      animationEasingUpdate: "cubicOut",
      height: "88%",
      left: "4%",
      top: "6%",
      width: "92%",
    },
    summary: "ECharts wordCloud extension 기반 KMSF 워드클라우드 예제입니다.",
    title: "WordCloud Extension",
    type: "wordCloud",
  },
];
