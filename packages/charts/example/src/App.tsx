import { useEffect, useMemo, useState } from "react";

import {
  GaugeChart,
  SankeyChart,
  SunburstChart,
  TopChart,
  TrendChart,
  WordCloud,
  createTopRows,
  createTrendRows,
} from "../../src";

type ChartKey = "trend" | "top" | "sankey" | "wordcloud" | "gauge" | "sunburst";

const chartMenus: Array<{ key: ChartKey; label: string; summary: string }> = [
  { key: "trend", label: "TrendChart", summary: "60초 window를 1초마다 전체 교체" },
  { key: "top", label: "TopChart", summary: "TOP N category/value 예제" },
  { key: "sankey", label: "SankeyChart", summary: "10초마다 flow 데이터 교체" },
  { key: "wordcloud", label: "WordCloud", summary: "랜덤 컬러 keyword cloud" },
  { key: "gauge", label: "GaugeChart", summary: "5초마다 단일 지표 교체" },
  { key: "sunburst", label: "SunburstChart", summary: "5초마다 계층 데이터 교체" },
];

const trendSeries = [
  { id: "visits", name: "방문 수" },
  { id: "orders", name: "주문 수" },
];

const topData = createTopRows([
  { name: "Alpha", value: 100 },
  { name: "Beta", value: 200 },
  { name: "Gamma", value: 140 },
  { name: "Delta", value: 90 },
]);

const wordCloudData = [
  { name: "React", value: 120 },
  { name: "ECharts", value: 96 },
  { name: "KMSF", value: 80 },
  { name: "Dashboard", value: 64 },
  { name: "Analytics", value: 58 },
  { name: "Chart", value: 44 },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function buildTrendData(tick: number) {
  return createTrendRows(
    Array.from({ length: 60 }, (_, index) => {
      const second = tick + index + 1;

      return {
        x: `2026-04-25 10:${pad(Math.floor(second / 60))}:${pad(second % 60)}`,
        values: [
          900 + ((second * 37) % 520),
          80 + ((second * 11) % 180),
        ],
      };
    }),
  );
}

function buildSankeyData(tick: number) {
  const nodes = [
    { name: "Visit" },
    { name: "Signup" },
    { name: "Trial" },
    { name: "Purchase" },
  ];
  const links = [
    { source: "Visit", target: "Signup", value: 80 + tick * 4 },
    { source: "Signup", target: "Trial", value: 48 + tick * 3 },
    { source: "Trial", target: "Purchase", value: 24 + tick * 2 },
  ];

  return { links, nodes };
}

function buildGaugeData(tick: number) {
  return [{ name: "Conversion", value: 35 + ((tick * 13) % 60) }];
}

function buildSunburstData(tick: number) {
  return [
    {
      name: "Traffic",
      children: [
        { name: "Organic", value: 40 + ((tick * 5) % 18) },
        { name: "Paid", value: 24 + ((tick * 7) % 16) },
        { name: "Referral", value: 16 + ((tick * 3) % 12) },
      ],
    },
  ];
}

function getUsageCode(activeChart: ChartKey) {
  switch (activeChart) {
    case "trend":
      return `const data = newData.map((row) => [row.time, row.visits, row.orders]);

<TrendChart
  data={data}
  mode="area"
  series={[
    { id: "visits", name: "방문 수" },
    { id: "orders", name: "주문 수" },
  ]}
/>`;
    case "top":
      return `const data = createTopRows([
  { name: "Alpha", value: 100 },
  { name: "Beta", value: 200 },
]);

<TopChart data={data} mode="column" />`;
    case "sankey":
      return `<SankeyChart
  data={nodes}
  series={[{ data: nodes, links, name: "Flow" }]}
/>`;
    case "wordcloud":
      return `<WordCloud
  data={keywords}
  series={[{ data: keywords, name: "Keywords" }]}
/>`;
    case "gauge":
      return `<GaugeChart
  data={[{ name: "Conversion", value }]}
  max={100}
  unit="%"
/>`;
    case "sunburst":
      return `<SunburstChart
  data={treeData}
  radius={["20%", "85%"]}
/>`;
  }
}

export function App() {
  const [activeChart, setActiveChart] = useState<ChartKey>("trend");
  const [trendTick, setTrendTick] = useState(0);
  const [sankeyTick, setSankeyTick] = useState(0);
  const [gaugeTick, setGaugeTick] = useState(0);
  const [sunburstTick, setSunburstTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setTrendTick((value) => value + 1), 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setSankeyTick((value) => value + 1), 10_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setGaugeTick((value) => value + 1), 5000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setSunburstTick((value) => value + 1), 5000);

    return () => window.clearInterval(interval);
  }, []);

  const trendData = useMemo(() => buildTrendData(trendTick), [trendTick]);
  const sankeyData = useMemo(() => buildSankeyData(sankeyTick), [sankeyTick]);
  const gaugeData = useMemo(() => buildGaugeData(gaugeTick), [gaugeTick]);
  const sunburstData = useMemo(() => buildSunburstData(sunburstTick), [sunburstTick]);

  const sampleData = useMemo(() => {
    switch (activeChart) {
      case "trend":
        return { data: trendData.slice(-6), series: trendSeries };
      case "top":
        return { data: topData };
      case "sankey":
        return sankeyData;
      case "wordcloud":
        return { data: wordCloudData };
      case "gauge":
        return { data: gaugeData };
      case "sunburst":
        return { data: sunburstData };
    }
  }, [activeChart, gaugeData, sankeyData, sunburstData, trendData]);
  const activeMenu = chartMenus.find((item) => item.key === activeChart) ?? chartMenus[0]!;
  const usageCode = useMemo(() => getUsageCode(activeChart), [activeChart]);

  return (
    <div className="example-shell">
      <header className="example-header">
        <h1>@kmsf/charts</h1>
      </header>

      <div className="example-workspace">
        <aside className="sample-sidebar">
          <nav aria-label="차트 샘플 메뉴" className="chart-menu">
            {chartMenus.map((item) => (
              <button
                aria-pressed={activeChart === item.key}
                className="chart-menu-button"
                key={item.key}
                onClick={() => setActiveChart(item.key)}
                type="button"
              >
                <span>{item.label}</span>
                <small>{item.summary}</small>
              </button>
            ))}
          </nav>

          <section className="sample-data-panel" aria-label="선택된 차트 샘플 데이터">
            <h2>{activeMenu.label} Sample</h2>
            <p>{activeMenu.summary}</p>
            <h3>Data</h3>
            <pre data-testid="sample-data">{JSON.stringify(sampleData, null, 2)}</pre>
            <h3>Usage</h3>
            <pre data-testid="sample-code">{usageCode}</pre>
          </section>
        </aside>

        <main aria-label="차트 예제" className="chart-example-main">
          <section className="chart-stage" data-testid="chart-stage">
            {activeChart === "trend" && (
              <>
                <h2>TrendChart</h2>
                <div className="chart-viewport">
                  <TrendChart data={trendData} height="100%" mode="area" series={trendSeries} />
                </div>
              </>
            )}

            {activeChart === "top" && (
              <>
                <h2>TopChart</h2>
                <div className="chart-viewport">
                  <TopChart data={topData} height="100%" mode="column" />
                </div>
              </>
            )}

            {activeChart === "sankey" && (
              <>
                <h2>SankeyChart</h2>
                <div className="chart-viewport">
                  <SankeyChart
                    data={sankeyData.nodes}
                    height="100%"
                    series={[{ data: sankeyData.nodes, links: sankeyData.links, name: "Flow" }]}
                  />
                </div>
              </>
            )}

            {activeChart === "wordcloud" && (
              <>
                <h2>WordCloud</h2>
                <div className="chart-viewport">
                  <WordCloud
                    data={wordCloudData}
                    height="100%"
                    series={[{ data: wordCloudData, name: "Keywords" }]}
                  />
                </div>
              </>
            )}

            {activeChart === "gauge" && (
              <>
                <h2>GaugeChart</h2>
                <div className="chart-viewport">
                  <GaugeChart data={gaugeData} height="100%" max={100} unit="%" />
                </div>
              </>
            )}

            {activeChart === "sunburst" && (
              <>
                <h2>SunburstChart</h2>
                <div className="chart-viewport">
                  <SunburstChart data={sunburstData} height="100%" radius={["20%", "85%"]} />
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
