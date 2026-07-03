import type { EChartsOption, SeriesOption } from "echarts";

import type { GenericChartDataFormat, KmsfChartType } from "../../../src";
import { getExampleColor } from "./chart-colors";

export interface SampleClock {
  flowTick: number;
  topTick: number;
  trendTick: number;
}

export interface ChartSample {
  buildData: (clock: SampleClock, seriesCount?: number) => unknown;
  buildOptions?: (clock: SampleClock, seriesCount?: number) => EChartsOption;
  buildSeries?: (clock: SampleClock, seriesCount?: number) => SeriesOption[];
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

function countFixtureSeries(seriesCount = 1) {
  if (!Number.isFinite(seriesCount)) {
    return 1;
  }

  return Math.max(1, Math.min(3, Math.round(seriesCount)));
}

function buildNamedSeries(count: number, factory: (index: number) => SeriesOption): SeriesOption[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `Series ${index + 1}`,
    ...factory(index),
  }) as SeriesOption);
}

function getSeededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;

  return value - Math.floor(value);
}

function buildRandomTrendRows(tick: number, seriesCount = 1, length: number) {
  return Array.from({ length }, (_, index) => {
    const second = tick + index + 1;
    const values = Array.from({ length: Math.max(1, seriesCount) }, (_, seriesIndex) => {
      const seed = (tick + 1) * 97 + (index + 1) * 53 + (seriesIndex + 1) * 191;

      return Math.round(getSeededRandom(seed) * 500);
    });

    return [
      `2026-05-26 10:${pad(Math.floor(second / 60))}:${pad(second % 60)}`,
      ...values,
    ];
  });
}

export function buildTrendRows(tick: number, seriesCount = 1) {
  return buildRandomTrendRows(tick, seriesCount, 40);
}

export function buildLiveTrendRows(tick: number, seriesCount = 1) {
  return buildRandomTrendRows(tick, seriesCount, 30);
}

export function buildTopRows(tick: number) {
  return topNames.map((name, index) => [name, 20 + ((tick * (index + 3) * 23 + index * 59) % 460)]);
}

export function buildTopRowsWithSeries(tick: number, seriesCount = 1) {
  return buildTopRows(tick).map(([name, value], rowIndex) => {
    const numericValue = Number(value);
    const values = Array.from({ length: Math.max(1, seriesCount) }, (_, seriesIndex) => {
      return numericValue + ((tick + rowIndex + 1) * (seriesIndex + 3) * 7) % 140;
    });

    return [name, ...values];
  });
}

function buildFunnelRows(tick: number) {
  const labels = ["Visit", "Signup", "Trial", "Quote", "Purchase"];

  return labels.map((name, index) => [name, 80 + ((tick * (index + 5) * 17 + index * 61) % 360)]);
}

function buildScatterRows(tick: number, seriesCount = 1) {
  return Array.from({ length: 24 }, (_, index) => {
    const second = tick + index + 1;
    const values = Array.from({ length: Math.max(1, seriesCount) }, (_, seriesIndex) => {
      return (second * (19 + seriesIndex * 13) + tick * 17 + seriesIndex * 71) % (180 + seriesIndex * 40);
    });

    return [
      `2026-05-26 11:${pad(Math.floor(second / 60))}:${pad(second % 60)}`,
      ...values,
    ];
  });
}

function buildSankeyNodes(index: number) {
  const prefix = `S${index + 1}`;

  return [
    { name: `${prefix} Website` },
    { name: `${prefix} Campaign` },
    { name: `${prefix} Referral` },
    { name: `${prefix} Signup` },
    { name: `${prefix} Trial` },
    { name: `${prefix} Demo` },
    { name: `${prefix} Purchase` },
    { name: `${prefix} Expansion` },
  ];
}

function buildSankeyLinks(tick: number, index = 0) {
  const prefix = `S${index + 1}`;
  const weight = index + 1;

  return [
    { source: `${prefix} Website`, target: `${prefix} Signup`, value: 80 + tick * 8 + weight * 12 },
    { source: `${prefix} Campaign`, target: `${prefix} Signup`, value: 66 + tick * 7 + weight * 11 },
    { source: `${prefix} Referral`, target: `${prefix} Signup`, value: 42 + tick * 6 + weight * 9 },
    { source: `${prefix} Signup`, target: `${prefix} Trial`, value: 68 + tick * 6 + weight * 10 },
    { source: `${prefix} Signup`, target: `${prefix} Demo`, value: 32 + tick * 5 + weight * 7 },
    { source: `${prefix} Trial`, target: `${prefix} Purchase`, value: 40 + tick * 5 + weight * 8 },
    { source: `${prefix} Demo`, target: `${prefix} Purchase`, value: 24 + tick * 4 + weight * 6 },
    { source: `${prefix} Purchase`, target: `${prefix} Expansion`, value: 18 + tick * 4 + weight * 5 },
    { source: `${prefix} Trial`, target: `${prefix} Expansion`, value: 12 + tick * 3 + weight * 4 },
    { source: `${prefix} Campaign`, target: `${prefix} Demo`, value: 15 + tick * 3 + weight * 5 },
  ];
}

function buildGaugeRows(tick: number) {
  return [["Conversion", (tick * 17) % 101]];
}

function buildHeatmapData(tick: number) {
  return productLabels.flatMap((_, xIndex) =>
    ["A", "B", "C"].map((__, yIndex) => [xIndex, yIndex, (tick * 5 + xIndex * 17 + yIndex * 29) % 101]),
  );
}

function buildRadarItem(tick: number, index = 0) {
  return {
    name: `Series ${index + 1}`,
    value: [92, 84, 78, 88, 75].map((value, valueIndex) => {
      return Math.min(100, value + ((tick + index * 7 + valueIndex * 3) % 12));
    }),
  };
}

function buildTreeRoot(tick: number, index = 0) {
  const prefix = `Series ${index + 1}`;
  const offset = tick + index * 9;

  return {
    name: prefix,
    children: [
      {
        name: `${prefix} Alpha`,
        children: [
          { name: `${prefix} Alpha Leaf 1`, value: 40 + offset },
          { name: `${prefix} Alpha Leaf 2`, value: 30 + offset },
        ],
      },
      {
        name: `${prefix} Beta`,
        children: [
          { name: `${prefix} Beta Leaf 1`, value: 28 + offset },
          { name: `${prefix} Beta Leaf 2`, value: 22 + offset },
        ],
      },
      {
        name: `${prefix} Gamma`,
        children: [
          { name: `${prefix} Gamma Leaf 1`, value: 18 + offset },
          { name: `${prefix} Gamma Leaf 2`, value: 14 + offset },
        ],
      },
    ],
  };
}

function buildGraphNodes(tick: number) {
  return [
    { name: "Entry", symbolSize: 38, value: 90 + tick, x: 60, y: 150 },
    { name: "Search", symbolSize: 30, value: 72 + tick, x: 180, y: 80 },
    { name: "Social", symbolSize: 28, value: 64 + tick, x: 180, y: 220 },
    { name: "Signup", symbolSize: 34, value: 58 + tick, x: 320, y: 150 },
    { name: "Trial", symbolSize: 28, value: 44 + tick, x: 460, y: 90 },
    { name: "Demo", symbolSize: 24, value: 32 + tick, x: 460, y: 220 },
    { name: "Purchase", symbolSize: 32, value: 26 + tick, x: 620, y: 150 + (tick % 18) },
    { name: "Expansion", symbolSize: 22, value: 16 + tick, x: 760, y: 150 },
  ];
}

function buildGraphLinks(tick: number) {
  return [
    { source: "Entry", target: "Search", value: 90 + tick },
    { source: "Entry", target: "Social", value: 76 + tick },
    { source: "Search", target: "Signup", value: 58 + tick },
    { source: "Social", target: "Signup", value: 44 + tick },
    { source: "Signup", target: "Trial", value: 38 + tick },
    { source: "Signup", target: "Demo", value: 28 + tick },
    { source: "Trial", target: "Purchase", value: 24 + tick },
    { source: "Demo", target: "Purchase", value: 18 + tick },
    { source: "Purchase", target: "Expansion", value: 12 + tick },
    { source: "Trial", target: "Expansion", value: 8 + tick },
  ];
}

function withSunburstColors(nodes: Array<Record<string, unknown>>, offset = 0): Array<Record<string, unknown>> {
  return nodes.map((node, index) => {
    const children = Array.isArray(node.children)
      ? withSunburstColors(node.children as Array<Record<string, unknown>>, offset + index + 1)
      : undefined;

    return {
      ...node,
      itemStyle: { color: getExampleColor(offset + index) },
      ...(children ? { children } : {}),
    };
  });
}

function buildSunburstData(tick: number) {
  return withSunburstColors([
    {
      name: "Traffic",
      children: [
        {
          name: "Organic",
          children: [
            { name: "Search", value: 46 + tick },
            { name: "Content", value: 30 + tick },
          ],
        },
        {
          name: "Paid",
          children: [
            { name: "Ads", value: 28 + tick },
            { name: "Retargeting", value: 16 + tick },
          ],
        },
        {
          name: "Referral",
          children: [
            { name: "Partner", value: 18 + tick },
            { name: "Community", value: 12 + tick },
          ],
        },
      ],
    },
  ]);
}

function buildThemeRiverRows(tick: number) {
  const categories = ["Organic", "Paid", "Referral", "Direct"];

  return Array.from({ length: 12 }, (_, dayIndex) =>
    categories.map((category, categoryIndex) => [
      `2026/05/${pad(dayIndex + 1)}`,
      8 + ((tick * (categoryIndex + 2) + dayIndex * (categoryIndex + 4) + categoryIndex * 11) % 32),
      category,
    ]),
  ).flat();
}

function buildParallelRows(tick: number, index = 0) {
  const offset = tick + index * 14;

  return [
    [12 + offset, 38 + index * 8, 42 + tick],
    [28 + offset, 55 + index * 8, 64 + tick],
    [45 + offset, 72 + index * 8, 80 + tick],
    [66 + offset, 84 + index * 8, 92 + tick],
  ];
}

export const chartSamples: ChartSample[] = [
  {
    buildData: ({ trendTick }, seriesCount) => buildTrendRows(trendTick, seriesCount),
    category: "Trend",
    dataFormat: "trend",
    summary: "시간 흐름에 따른 단일 지표 변화를 보여주는 라인 차트",
    type: "line",
  },
  {
    buildData: ({ topTick }, seriesCount) => buildTopRowsWithSeries(topTick, seriesCount),
    category: "Top",
    dataFormat: "top",
    summary: "순위형 데이터를 가로 막대로 비교하는 TOP 차트",
    type: "bar",
  },
  {
    buildData: ({ topTick }, seriesCount) => buildTopRowsWithSeries(topTick, countFixtureSeries(seriesCount)),
    category: "Top",
    dataFormat: "top",
    seriesOptions: { center: ["34%", "52%"], label: { show: false }, radius: ["32%", "66%"] },
    summary: "구성 비율을 조각 단위로 비교하는 파이 차트",
    type: "pie",
  },
  {
    buildData: ({ trendTick }, seriesCount) => buildScatterRows(trendTick, seriesCount),
    category: "Trend",
    dataFormat: "trend",
    summary: "시간과 값의 분포를 점으로 확인하는 산점도",
    type: "scatter",
  },
  {
    buildData: ({ trendTick }, seriesCount) => buildScatterRows(trendTick, seriesCount),
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
    buildData: ({ topTick }, seriesCount) =>
      Array.from({ length: countFixtureSeries(seriesCount) }, (_, index) => buildRadarItem(topTick, index)),
    buildOptions: () => ({
      radar: {
        indicator: [
          { name: "UX" },
          { name: "API" },
          { name: "Perf" },
          { name: "Docs" },
          { name: "A11y" },
        ],
      },
    }),
    buildSeries: ({ topTick }, seriesCount) =>
      buildNamedSeries(countFixtureSeries(seriesCount), (index) => ({
        data: [buildRadarItem(topTick, index)],
      })),
    category: "Native",
    dataFormat: "native",
    summary: "여러 평가 축의 균형을 다각형으로 비교하는 차트",
    type: "radar",
  },
  {
    buildData: ({ topTick }) => buildHeatmapData(topTick),
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
    buildData: ({ topTick }) => [buildTreeRoot(topTick)],
    buildSeries: ({ topTick }, seriesCount) =>
      buildNamedSeries(countFixtureSeries(seriesCount), (index) => ({
        data: [buildTreeRoot(topTick, index)],
        label: { overflow: "truncate", width: 92 },
        leaves: { label: { overflow: "truncate", width: 92 } },
        left: `${4 + index * 32}%`,
        orient: "LR",
        right: `${68 - index * 32}%`,
        top: 64,
      })),
    category: "Native",
    dataFormat: "native",
    summary: "계층형 parent-child 구조를 노드로 보여주는 트리 차트",
    type: "tree",
  },
  {
    buildData: ({ topTick }) => buildTopRows(topTick),
    category: "Top",
    dataFormat: "top",
    seriesOptions: { height: "88%", left: "4%", top: "6%", width: "92%" },
    summary: "TOP 값을 면적 크기로 비교하는 트리맵",
    type: "treemap",
  },
  {
    buildData: ({ topTick }) => buildSunburstData(topTick),
    buildSeries: ({ topTick }, seriesCount) =>
      buildNamedSeries(countFixtureSeries(seriesCount), (index) => ({
        center: countFixtureSeries(seriesCount) === 1 ? ["50%", "52%"] : [["22%", "52%"], ["50%", "52%"], ["78%", "52%"]][index],
        data: buildSunburstData(topTick + index * 7),
        label: { show: false },
        labelLine: { show: false },
        radius: countFixtureSeries(seriesCount) === 1 ? ["12%", "86%"] : ["18%", "38%"],
      })),
    category: "Native",
    dataFormat: "native",
    seriesOptions: { center: ["50%", "52%"], label: { show: false }, labelLine: { show: false }, radius: ["12%", "86%"] },
    summary: "계층형 비율을 동심원 구조로 표현하는 선버스트",
    type: "sunburst",
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
    buildData: ({ flowTick }) => buildGraphNodes(flowTick),
    buildSeries: ({ flowTick }) => [
      {
        label: { show: false },
        layout: "none",
        links: buildGraphLinks(flowTick),
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
    buildData: ({ topTick }) => buildParallelRows(topTick),
    buildOptions: () => ({
      parallel: { left: 48, right: 28, top: 64 },
      parallelAxis: [
        { dim: 0, name: "Speed" },
        { dim: 1, name: "Cost" },
        { dim: 2, name: "Score" },
      ],
    }),
    buildSeries: ({ topTick }, seriesCount) =>
      buildNamedSeries(countFixtureSeries(seriesCount), (index) => ({
        data: buildParallelRows(topTick, index),
        lineStyle: { width: 2 },
      })),
    category: "Native",
    dataFormat: "native",
    summary: "여러 축에 걸친 항목별 수치를 한 번에 비교하는 평행좌표",
    type: "parallel",
  },
  {
    buildData: ({ topTick }) => buildGaugeRows(topTick),
    buildSeries: ({ topTick }, seriesCount) =>
      buildNamedSeries(countFixtureSeries(seriesCount), (index) => ({
        axisLine: {
          lineStyle: {
            color: [
              [0.35, getExampleColor(1)],
              [0.72, getExampleColor(3)],
              [1, getExampleColor(6)],
            ],
            width: 14,
          },
        },
        axisTick: { distance: -18, length: 5 },
        center: countFixtureSeries(seriesCount) === 1 ? ["50%", "58%"] : [["22%", "58%"], ["50%", "58%"], ["78%", "58%"]][index],
        data: [{ name: `Conversion ${index + 1}`, value: (topTick * (17 + index * 5) + index * 23) % 101 }],
        detail: {
          formatter: "{value}%",
          fontSize: 18,
          offsetCenter: [0, "64%"],
        },
        max: 100,
        min: 0,
        pointer: { length: "58%", width: 4 },
        progress: { show: true, width: 14 },
        radius: countFixtureSeries(seriesCount) === 1 ? "66%" : "34%",
        title: { fontSize: 12, offsetCenter: [0, "88%"] },
      })),
    category: "Top",
    dataFormat: "top",
    seriesOptions: { max: 100, min: 0 },
    summary: "단일 핵심 지표의 현재 상태를 계기판 형태로 표시하는 차트",
    type: "gauge",
  },
  {
    buildData: ({ topTick }) => buildFunnelRows(topTick),
    category: "Top",
    dataFormat: "top",
    seriesOptions: { label: { show: false }, left: "12%", top: 48, width: "76%" },
    summary: "단계별 전환 규모를 깔때기 형태로 비교하는 차트",
    type: "funnel",
  },
  {
    buildData: () => buildSankeyNodes(0),
    buildSeries: ({ flowTick }, seriesCount) =>
      buildNamedSeries(countFixtureSeries(seriesCount), (index) => {
        const count = countFixtureSeries(seriesCount);

        return {
          bottom: count === 1 ? 12 : `${57 - index * 25}%`,
          data: buildSankeyNodes(index),
          emphasis: { focus: "adjacency" },
          label: { overflow: "truncate", width: 86 },
          left: 12,
          links: buildSankeyLinks(flowTick, index),
          right: 12,
          top: count === 1 ? 56 : `${18 + index * 25}%`,
        };
      }),
    category: "Native",
    dataFormat: "native",
    summary: "출발 노드에서 도착 노드로 흐르는 양을 표현하는 Sankey 차트",
    type: "sankey",
  },
  {
    buildData: ({ topTick }) => buildThemeRiverRows(topTick),
    buildOptions: () => ({
      singleAxis: { bottom: 40, left: 48, right: 24, top: 64, type: "time" },
    }),
    category: "Native",
    dataFormat: "native",
    summary: "시간에 따른 여러 범주의 흐름 변화를 강 형태로 표현하는 차트",
    type: "themeRiver",
  },
  {
    buildData: ({ topTick }, seriesCount) => buildTopRowsWithSeries(topTick, seriesCount),
    category: "Top",
    dataFormat: "top",
    seriesOptions: { symbol: "rect", symbolRepeat: true, symbolSize: [8, 12] },
    summary: "반복 심볼로 TOP 값을 시각적으로 비교하는 pictorial bar",
    type: "pictorialBar",
  },
  {
    buildData: ({ topTick }, seriesCount) =>
      topNames.map((name, rowIndex) => {
        const values = Array.from({ length: countFixtureSeries(seriesCount) }, (_, seriesIndex) => {
          return 24 + ((topTick * 11 + rowIndex * 17 + seriesIndex * 29) % 120);
        });

        return [name, ...values];
      }),
    category: "Top",
    dataFormat: "top",
    seriesOptions: {
      animationDuration: 300,
      animationDurationUpdate: 700,
      animationEasingUpdate: "cubicOut",
      height: "88%",
      left: "4%",
      top: "6%",
      width: "92%",
    },
    summary: "키워드 중요도를 글자 크기와 색상으로 표현하는 워드 클라우드",
    type: "wordCloud",
  },
];

export function getUsageCode(sample: ChartSample) {
  if (sample.type === "line") {
    return `<TrendChart
  data={trendRows}
  series={[
    { id: "series-1", name: "Series 1" },
    { id: "series-2", name: "Series 2" },
  ]}
/>`;
  }

  if (sample.type === "bar" || sample.type === "pie" || sample.type === "treemap") {
    return `<TopChart
  data={topRows}
  mode="${sample.type}"
/>`;
  }

  if (sample.type === "gauge") {
    return `<GaugeChart
  data={[{ name: "Score", value: 72 }]}
  seriesOptions={seriesOptions}
/>`;
  }

  if (sample.type === "sunburst") {
    return `<SunburstChart data={data} />`;
  }

  if (sample.type === "wordCloud") {
    return `<WordCloud data={data} />`;
  }

  if (sample.type === "radar") {
    return `<RadarChart
  data={data}
  indicators={indicators}
  series={series}
/>`;
  }

  if (sample.type === "heatmap") {
    return `<HeatmapChart
  data={data}
  xAxisData={xAxisData}
  yAxisData={yAxisData}
  visualMap={visualMap}
/>`;
  }

  if (sample.type === "graph") {
    return `<GraphChart
  nodes={nodes}
  links={links}
  layout="force"
/>`;
  }

  if (sample.type === "sankey") {
    return `<SankeyChart
  data={nodes}
  links={links}
/>`;
  }

  const dataFormatLine = sample.dataFormat ? `\n  dataFormat="${sample.dataFormat}"` : "";
  const optionsLine = sample.buildOptions ? "\n  options={options}" : "";
  const seriesLine = sample.buildSeries ? "\n  series={series}" : "";
  const seriesOptionsLine = sample.seriesOptions ? "\n  seriesOptions={seriesOptions}" : "";

  return `<GenericChart
  type="${sample.type}"
  data={data}${dataFormatLine}${seriesLine}${seriesOptionsLine}${optionsLine}
/>`;
}
