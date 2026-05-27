import type { EChartsOption, SeriesOption } from "echarts";

import type { GenericChartDataFormat, KmsfChartType } from "../../../src";

export interface SampleClock {
  flowTick: number;
  topTick: number;
  trendTick: number;
}

export interface ChartSample {
  buildData: (clock: SampleClock) => unknown;
  buildOptions?: (clock: SampleClock) => EChartsOption;
  buildSeries?: (clock: SampleClock) => SeriesOption[];
  category: "Trend" | "Top" | "Native" | "Advanced";
  dataFormat?: GenericChartDataFormat;
  disabledReason?: string;
  seriesOptions?: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  summary: string;
  type: KmsfChartType;
}

const productLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const topNames = Array.from({ length: 50 }, (_, index) => `Metric ${pad(index + 1)}`);

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function buildTrendRows(tick: number) {
  return Array.from({ length: 40 }, (_, index) => {
    const second = tick + index + 1;

    return [
      `2026-05-26 10:${pad(Math.floor(second / 60))}:${pad(second % 60)}`,
      900 + ((second * 37) % 520),
    ];
  });
}

export function buildTopRows(tick: number) {
  return topNames.map((name, index) => [name, 80 + ((tick * (index + 3) * 11 + index * 47) % 180)]);
}

function buildScatterRows(tick: number) {
  return Array.from({ length: 24 }, (_, index) => {
    const second = tick + index + 1;

    return [
      `2026-05-26 11:${pad(Math.floor(second / 60))}:${pad(second % 60)}`,
      40 + ((second * 19) % 120),
    ];
  });
}

function buildSankeyLinks(tick: number) {
  return [
    { source: "Visit", target: "Signup", value: 80 + tick * 4 },
    { source: "Signup", target: "Trial", value: 48 + tick * 3 },
    { source: "Trial", target: "Purchase", value: 24 + tick * 2 },
  ];
}

function buildGaugeRows(tick: number) {
  return [["Conversion", 35 + ((tick * 13) % 60)]];
}

function buildHeatmapData(tick: number) {
  return productLabels.flatMap((_, xIndex) =>
    ["A", "B", "C"].map((__, yIndex) => [xIndex, yIndex, 20 + ((tick + xIndex * 7 + yIndex * 11) % 80)]),
  );
}

export const chartSamples: ChartSample[] = [
  {
    buildData: ({ trendTick }) => buildTrendRows(trendTick),
    category: "Trend",
    dataFormat: "trend",
    summary: "시간 흐름에 따른 단일 지표 변화를 보여주는 라인 차트",
    type: "line",
  },
  {
    buildData: ({ topTick }) => buildTopRows(topTick),
    category: "Top",
    dataFormat: "top",
    summary: "순위형 데이터를 가로 막대로 비교하는 TOP 차트",
    type: "bar",
  },
  {
    buildData: ({ topTick }) => buildTopRows(topTick),
    category: "Top",
    dataFormat: "top",
    summary: "구성 비율을 조각 단위로 비교하는 파이 차트",
    type: "pie",
  },
  {
    buildData: ({ trendTick }) => buildScatterRows(trendTick),
    category: "Trend",
    dataFormat: "trend",
    summary: "시간과 값의 분포를 점으로 확인하는 산점도",
    type: "scatter",
  },
  {
    buildData: ({ trendTick }) => buildScatterRows(trendTick),
    category: "Trend",
    dataFormat: "trend",
    summary: "분포 중 강조 지점을 더 눈에 띄게 표현하는 산점도",
    type: "effectScatter",
  },
  {
    buildData: ({ topTick }) => [
      [20 + (topTick % 8), 34, 10, 38],
      [40, 35 + (topTick % 8), 30, 50],
      [31, 38, 33 + (topTick % 8), 44],
      [38, 15, 5, 42 + (topTick % 8)],
      [28, 42, 22, 48 + (topTick % 8)],
    ],
    buildOptions: () => ({
      xAxis: { data: productLabels, type: "category" },
      yAxis: { type: "value" },
    }),
    category: "Native",
    dataFormat: "native",
    summary: "시가, 종가, 고가, 저가를 함께 표현하는 금융형 차트",
    type: "candlestick",
  },
  {
    buildData: ({ topTick }) => [{ name: "KMSF", value: [92, 84, 78, 88, 75].map((value) => value + (topTick % 5)) }],
    buildOptions: () => ({
      radar: {
        indicator: [
          { name: "UX", max: 110 },
          { name: "API", max: 110 },
          { name: "Perf", max: 110 },
          { name: "Docs", max: 110 },
          { name: "A11y", max: 110 },
        ],
      },
    }),
    category: "Native",
    dataFormat: "native",
    summary: "여러 평가 축의 균형을 다각형으로 비교하는 차트",
    type: "radar",
  },
  {
    buildData: ({ trendTick }) => buildHeatmapData(trendTick),
    buildOptions: () => ({
      visualMap: { calculable: true, max: 100, min: 0, orient: "horizontal" },
      xAxis: { data: productLabels, type: "category" },
      yAxis: { data: ["A", "B", "C"], type: "category" },
    }),
    category: "Native",
    dataFormat: "native",
    summary: "두 축의 교차 지점 값을 색상 밀도로 표현하는 히트맵",
    type: "heatmap",
  },
  {
    buildData: ({ topTick }) => [
      {
        name: "Root",
        children: [
          { name: "Alpha", value: 40 + topTick },
          { name: "Beta", value: 28 + topTick },
          { name: "Gamma", value: 18 + topTick },
        ],
      },
    ],
    category: "Native",
    dataFormat: "native",
    summary: "계층형 parent-child 구조를 노드로 보여주는 트리 차트",
    type: "tree",
  },
  {
    buildData: ({ topTick }) => buildTopRows(topTick),
    category: "Top",
    dataFormat: "top",
    summary: "TOP 값을 면적 크기로 비교하는 트리맵",
    type: "treemap",
  },
  {
    buildData: ({ topTick }) => [
      {
        name: "Traffic",
        children: [
          { name: "Organic", value: 46 + topTick },
          { name: "Paid", value: 28 + topTick },
          { name: "Referral", value: 18 + topTick },
        ],
      },
    ],
    category: "Native",
    dataFormat: "native",
    seriesOptions: { radius: ["20%", "85%"] },
    summary: "계층형 비율을 동심원 구조로 표현하는 선버스트",
    type: "sunburst",
  },
  {
    buildData: () => [],
    category: "Advanced",
    dataFormat: "native",
    disabledReason: "map은 지도 리소스 등록 후 렌더링 대상에 포함합니다.",
    summary: "지도 리소스 등록 후 지역별 데이터를 표현하는 차트",
    type: "map",
  },
  {
    buildData: ({ flowTick }) => [
      { coords: [[0, 0], [4, 6 + flowTick]] },
      { coords: [[1, 8], [8, 3 + flowTick]] },
      { coords: [[2, 2], [9, 7 + flowTick]] },
    ],
    buildOptions: () => ({
      xAxis: { max: 10, min: 0, type: "value" },
      yAxis: { max: 10, min: 0, type: "value" },
    }),
    category: "Native",
    dataFormat: "native",
    seriesOptions: { coordinateSystem: "cartesian2d" },
    summary: "좌표 간 흐름이나 경로를 선으로 표현하는 차트",
    type: "lines",
  },
  {
    buildData: ({ flowTick }) => [
      { name: "Visit", x: 80, y: 140 },
      { name: "Signup", x: 220, y: 80 },
      { name: "Trial", x: 220, y: 210 },
      { name: "Purchase", x: 380, y: 140 + flowTick },
    ],
    buildSeries: () => [
      {
        label: { show: true },
        layout: "none",
        links: [
          { source: "Visit", target: "Signup" },
          { source: "Visit", target: "Trial" },
          { source: "Signup", target: "Purchase" },
          { source: "Trial", target: "Purchase" },
        ],
        roam: true,
      },
    ],
    category: "Native",
    dataFormat: "native",
    summary: "노드와 연결 관계를 탐색하는 네트워크 그래프",
    type: "graph",
  },
  {
    buildData: ({ topTick }) => [
      [18, 24, 31, 42, 55 + topTick],
      [12, 22, 28, 35, 46 + topTick],
      [20, 26, 33, 41, 58 + topTick],
    ],
    buildOptions: () => ({
      xAxis: { data: ["A", "B", "C"], type: "category" },
      yAxis: { type: "value" },
    }),
    category: "Native",
    dataFormat: "native",
    summary: "분포의 중앙값과 사분위 범위를 요약하는 박스플롯",
    type: "boxplot",
  },
  {
    buildData: ({ topTick }) => [
      [12, 38, 42 + topTick],
      [28, 55, 64 + topTick],
      [45, 72, 80 + topTick],
      [66, 84, 92 + topTick],
    ],
    buildOptions: () => ({
      parallel: { left: 48, right: 28 },
      parallelAxis: [
        { dim: 0, name: "Speed" },
        { dim: 1, name: "Cost" },
        { dim: 2, name: "Score" },
      ],
    }),
    category: "Native",
    dataFormat: "native",
    summary: "여러 축에 걸친 항목별 수치를 한 번에 비교하는 평행좌표",
    type: "parallel",
  },
  {
    buildData: ({ topTick }) => buildGaugeRows(topTick),
    category: "Top",
    dataFormat: "top",
    seriesOptions: { max: 100, min: 0 },
    summary: "단일 핵심 지표의 현재 상태를 계기판 형태로 표시하는 차트",
    type: "gauge",
  },
  {
    buildData: ({ topTick }) => buildTopRows(topTick),
    category: "Top",
    dataFormat: "top",
    summary: "단계별 전환 규모를 깔때기 형태로 비교하는 차트",
    type: "funnel",
  },
  {
    buildData: () => [{ name: "Visit" }, { name: "Signup" }, { name: "Trial" }, { name: "Purchase" }],
    buildSeries: ({ flowTick }) => [{ links: buildSankeyLinks(flowTick), name: "Flow" }],
    category: "Native",
    dataFormat: "native",
    summary: "출발 노드에서 도착 노드로 흐르는 양을 표현하는 Sankey 차트",
    type: "sankey",
  },
  {
    buildData: ({ topTick }) => [
      ["2026/05/01", 10 + topTick, "Organic"],
      ["2026/05/02", 15 + topTick, "Organic"],
      ["2026/05/03", 12 + topTick, "Organic"],
      ["2026/05/01", 7 + topTick, "Paid"],
      ["2026/05/02", 9 + topTick, "Paid"],
      ["2026/05/03", 14 + topTick, "Paid"],
    ],
    buildOptions: () => ({
      singleAxis: { bottom: 40, left: 48, right: 24, top: 44, type: "time" },
    }),
    category: "Native",
    dataFormat: "native",
    summary: "시간에 따른 여러 범주의 흐름 변화를 강 형태로 표현하는 차트",
    type: "themeRiver",
  },
  {
    buildData: ({ topTick }) => buildTopRows(topTick),
    category: "Top",
    dataFormat: "top",
    seriesOptions: { symbol: "rect", symbolRepeat: true, symbolSize: [8, 12] },
    summary: "반복 심볼로 TOP 값을 시각적으로 비교하는 pictorial bar",
    type: "pictorialBar",
  },
  {
    buildData: () => [],
    category: "Advanced",
    dataFormat: "native",
    disabledReason: "custom은 renderItem 구현을 전달하는 고급 사용 경로입니다.",
    summary: "사용자 renderItem으로 직접 도형을 그리는 고급 차트",
    type: "custom",
  },
  {
    buildData: ({ topTick }) => [
      ["React", 120 + topTick],
      ["ECharts", 96 + topTick],
      ["KMSF", 80 + topTick],
      ["Dashboard", 64 + topTick],
      ["Analytics", 58 + topTick],
      ["Chart", 44 + topTick],
    ],
    category: "Top",
    dataFormat: "top",
    summary: "키워드 중요도를 글자 크기와 색상으로 표현하는 워드 클라우드",
    type: "wordCloud",
  },
];

export function getUsageCode(sample: ChartSample) {
  const dataFormatLine = sample.dataFormat ? `\n  dataFormat="${sample.dataFormat}"` : "";
  const optionsLine = sample.buildOptions ? "\n  options={options}" : "";
  const seriesLine = sample.buildSeries ? "\n  series={series}" : "";
  const seriesOptionsLine = sample.seriesOptions ? "\n  seriesOptions={seriesOptions}" : "";

  return `<GenericChart
  type="${sample.type}"
  data={data}${dataFormatLine}${seriesLine}${seriesOptionsLine}${optionsLine}
/>`;
}
