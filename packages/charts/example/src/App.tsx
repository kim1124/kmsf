import { useEffect, useMemo, useRef, useState } from "react";
import type { EChartsOption, SeriesOption } from "echarts";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ChartBar,
  ChartLine,
  ChartNetwork,
  ChartNoAxesColumn,
  ChartPie,
  ChartScatter,
  ChevronsLeft,
  ChevronsRight,
  Cloud,
  FileJson,
  FileText,
  Gauge,
  GitBranch,
  Grid2X2,
  Library,
  Network,
  Palette,
  PanelRight,
  RefreshCw,
  Search,
  Sun,
  TableCellsSplit,
  Workflow,
} from "lucide-react";
import { DashboardGrid, useDashboardGrid } from "@kmsf/gridstack";
import type { DashboardWidget } from "@kmsf/gridstack";
import "gridstack/dist/gridstack.min.css";
import "@kmsf/gridstack/styles.css";

import { GenericChart } from "../../src";
import type { GenericChartDataFormat, KmsfChartType } from "../../src";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { ScrollArea } from "./components/ui/scroll-area";
import { Separator } from "./components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Textarea } from "./components/ui/textarea";
import { MarkdownDocument } from "./components/MarkdownDocument";
import { applyTopRowPalette, getSeriesPaletteOverride } from "./data/chart-colors";
import { chartSamples, getUsageCode } from "./data/chart-samples";
import type { ChartSample, SampleClock } from "./data/chart-samples";
import { parseEditableChartData, parseEditableOptions } from "./data/live-editing";
import { getChartDoc, searchChartDocs } from "./docs/chart-docs";

interface OptionState {
  accentIndex: number;
  legend: boolean;
  tooltip: boolean;
}

interface DashboardChartData {
  dataFormat?: GenericChartDataFormat;
  type: KmsfChartType;
}

const chartIconByType: Partial<Record<KmsfChartType, LucideIcon>> = {
  bar: ChartBar,
  boxplot: TableCellsSplit,
  candlestick: ChartNoAxesColumn,
  effectScatter: Activity,
  funnel: Workflow,
  gauge: Gauge,
  graph: Network,
  heatmap: TableCellsSplit,
  line: ChartLine,
  lines: GitBranch,
  parallel: Workflow,
  pictorialBar: ChartNoAxesColumn,
  pie: ChartPie,
  radar: Activity,
  sankey: ChartNetwork,
  scatter: ChartScatter,
  sunburst: Sun,
  themeRiver: Workflow,
  tree: GitBranch,
  treemap: Grid2X2,
  wordCloud: Cloud,
};

function getChartIcon(type: KmsfChartType): LucideIcon {
  return chartIconByType[type] ?? Activity;
}

function mergePlainObjects<TValue extends Record<string, unknown>>(base: TValue, override?: Record<string, unknown>): TValue {
  if (!override) {
    return base;
  }

  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = result[key];

    if (
      current &&
      value &&
      typeof current === "object" &&
      typeof value === "object" &&
      !Array.isArray(current) &&
      !Array.isArray(value)
    ) {
      result[key] = mergePlainObjects(current as Record<string, unknown>, value as Record<string, unknown>);
      continue;
    }

    result[key] = value;
  }

  return result as TValue;
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace("#", "") || "/");

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash.replace("#", "") || "/");

    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route;
}

function useSampleClock() {
  const [trendTick, setTrendTick] = useState(0);
  const [topTick, setTopTick] = useState(0);
  const [flowTick, setFlowTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setTrendTick((value) => value + 1), 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setTopTick((value) => value + 1), 10_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setFlowTick((value) => value + 1), 10_000);

    return () => window.clearInterval(interval);
  }, []);

  return useMemo<SampleClock>(() => ({ flowTick, topTick, trendTick }), [flowTick, topTick, trendTick]);
}

function useElementReadySize() {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return undefined;
    }

    const updateReadyState = () => {
      const rect = element.getBoundingClientRect();
      setIsReady(rect.width > 40 && rect.height > 40);
    };

    updateReadyState();
    const observer = new ResizeObserver(updateReadyState);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { elementRef, isReady };
}

function mergeSeriesOptions(sample: ChartSample): Partial<SeriesOption> | Array<Partial<SeriesOption>> {
  if (Array.isArray(sample.seriesOptions)) {
    return sample.seriesOptions;
  }

  return sample.seriesOptions ?? {};
}

function buildOptionSummary(input: {
  options?: EChartsOption;
  seriesOptions: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  state: OptionState;
  themeOverrides: { palette: string[] };
}) {
  return {
    legend: input.state.legend,
    options: input.options,
    seriesOptions: input.seriesOptions,
    themeOverrides: input.themeOverrides,
    tooltip: input.state.tooltip,
  };
}

function groupedSamples() {
  const groups = new Map<ChartSample["category"], ChartSample[]>();

  for (const sample of chartSamples) {
    const items = groups.get(sample.category) ?? [];
    items.push(sample);
    groups.set(sample.category, items);
  }

  return Array.from(groups.entries());
}

function ChartNavigation({
  activeType,
  collapsed,
  onCollapseToggle,
  onSelectType,
}: {
  activeType: KmsfChartType;
  collapsed: boolean;
  onCollapseToggle: () => void;
  onSelectType: (type: KmsfChartType) => void;
}) {
  return (
    <aside className="chart-aside" data-collapsed={collapsed}>
      <div className="aside-header">
        <div className="aside-heading">
          <Library aria-hidden="true" size={18} />
          {!collapsed ? <strong>차트 종류</strong> : null}
        </div>
        <Button
          aria-label={collapsed ? "차트 목록 펼치기" : "차트 목록 접기"}
          size="icon"
          variant="ghost"
          onClick={onCollapseToggle}
        >
          {collapsed ? <ChevronsRight aria-hidden="true" size={17} /> : <ChevronsLeft aria-hidden="true" size={17} />}
        </Button>
      </div>

      <ScrollArea className="chart-menu-scroll">
        <nav aria-label="차트 종류" className="chart-menu">
          {groupedSamples().map(([category, samples]) => (
            <div className="chart-menu-group" key={category}>
              {!collapsed ? <span className="chart-menu-group__label">{category}</span> : null}
              {samples.map((sample) => {
                const Icon = getChartIcon(sample.type);

                return (
                  <button
                    aria-label={`${sample.type} 차트 선택`}
                    aria-pressed={activeType === sample.type}
                    className="chart-menu-button"
                    disabled={Boolean(sample.disabledReason)}
                    key={sample.type}
                    onClick={() => onSelectType(sample.type)}
                    title={collapsed ? `${sample.type}: ${sample.summary}` : undefined}
                    type="button"
                  >
                    <Icon aria-hidden="true" size={17} />
                    {!collapsed ? (
                      <span className="chart-menu-button__text">
                        <span>{sample.type}</span>
                        <small>{sample.summary}</small>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}

function ChartDocsPanel({ activeType }: { activeType: KmsfChartType }) {
  const [query, setQuery] = useState("");
  const selectedDoc = getChartDoc(activeType);
  const docs = query.trim() ? searchChartDocs(query) : [selectedDoc];

  return (
    <aside aria-label="차트 문서" className="docs-aside">
      <div className="docs-search">
        <Search aria-hidden="true" size={16} />
        <Input
          aria-label="차트 문서 검색"
          placeholder="옵션 또는 기능 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <ScrollArea className="docs-scroll">
        {docs.length ? (
          docs.map((doc) => (
            <section className="docs-section" key={doc.type}>
              <MarkdownDocument markdown={doc.markdown} />
              <a className="official-doc-link" href={doc.officialDocsUrl} rel="noreferrer" target="_blank">
                ECharts 공식 문서
              </a>
            </section>
          ))
        ) : (
          <p className="docs-empty">검색 결과가 없습니다.</p>
        )}
      </ScrollArea>
    </aside>
  );
}

function MobileDocsButton({ activeType }: { activeType: KmsfChartType }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="mobile-docs-trigger" variant="outline">
          <PanelRight aria-hidden="true" size={16} />
          문서
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>차트 문서</SheetTitle>
          <SheetDescription>선택된 차트의 필수 props와 예시 코드입니다.</SheetDescription>
        </SheetHeader>
        <ChartDocsPanel activeType={activeType} />
      </SheetContent>
    </Sheet>
  );
}

function ChartWorkspacePage() {
  const [activeType, setActiveType] = useState<KmsfChartType>("line");
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [manualRefreshVersion, setManualRefreshVersion] = useState(0);
  const [optionState, setOptionState] = useState<OptionState>({
    accentIndex: 0,
    legend: true,
    tooltip: true,
  });
  const [dataText, setDataText] = useState("");
  const [dataDirty, setDataDirty] = useState(false);
  const [manualData, setManualData] = useState<unknown>();
  const [dataError, setDataError] = useState<string | null>(null);
  const [optionsText, setOptionsText] = useState("");
  const [optionDirty, setOptionDirty] = useState(false);
  const [manualOptions, setManualOptions] = useState<EChartsOption>({});
  const [optionError, setOptionError] = useState<string | null>(null);
  const clock = useSampleClock();
  const sampleClock = useMemo<SampleClock>(
    () => ({
      flowTick: clock.flowTick + manualRefreshVersion * 13,
      topTick: clock.topTick + manualRefreshVersion * 13,
      trendTick: clock.trendTick + manualRefreshVersion * 13,
    }),
    [clock, manualRefreshVersion],
  );
  const activeSample = chartSamples.find((sample) => sample.type === activeType) ?? chartSamples[0]!;
  const generatedData = useMemo(() => activeSample.buildData(sampleClock), [activeSample, sampleClock]);
  const coloredGeneratedData = useMemo(
    () => applyTopRowPalette(generatedData, activeSample.type, optionState.accentIndex),
    [activeSample.type, generatedData, optionState.accentIndex],
  );
  const sampleData = dataDirty && !dataError ? manualData : coloredGeneratedData;
  const sampleSeries = useMemo(() => activeSample.buildSeries?.(sampleClock), [activeSample, sampleClock]);
  const generatedOptions = useMemo(() => activeSample.buildOptions?.(sampleClock), [activeSample, sampleClock]);
  const sampleOptions = useMemo(
    () => mergePlainObjects((generatedOptions ?? {}) as Record<string, unknown>, manualOptions as Record<string, unknown>) as EChartsOption,
    [generatedOptions, manualOptions],
  );
  const seriesOptions = useMemo(() => mergeSeriesOptions(activeSample), [activeSample]);
  const themeOverrides = useMemo(
    () => ({ palette: getSeriesPaletteOverride(optionState.accentIndex) }),
    [optionState.accentIndex],
  );
  const usageCode = useMemo(() => getUsageCode(activeSample), [activeSample]);
  const optionSummary = useMemo(
    () => buildOptionSummary({ options: sampleOptions, seriesOptions, state: optionState, themeOverrides }),
    [optionState, sampleOptions, seriesOptions, themeOverrides],
  );
  const sampleSummary = useMemo(
    () => ({
      data: sampleData,
      dataFormat: activeSample.dataFormat ?? "auto",
      options: sampleOptions,
      series: sampleSeries,
      seriesOptions,
      type: activeSample.type,
    }),
    [activeSample, sampleData, sampleOptions, sampleSeries, seriesOptions],
  );
  const validationMessage = optionError ?? dataError;

  useEffect(() => {
    setDataDirty(false);
    setManualData(undefined);
    setDataError(null);
    setOptionDirty(false);
    setManualOptions({});
    setOptionError(null);
  }, [activeType]);

  useEffect(() => {
    if (!dataDirty) {
      setDataText(stringifyJson(coloredGeneratedData));
    }
  }, [coloredGeneratedData, dataDirty]);

  useEffect(() => {
    if (!optionDirty) {
      setOptionsText(stringifyJson(generatedOptions ?? {}));
    }
  }, [generatedOptions, optionDirty]);

  const handleDataTextChange = (value: string) => {
    setDataDirty(true);
    setDataText(value);

    const result = parseEditableChartData(value, activeSample.dataFormat);

    if (result.ok) {
      setManualData(result.value);
      setDataError(null);
      return;
    }

    setDataError(result.error);
  };

  const handleOptionsTextChange = (value: string) => {
    setOptionDirty(true);
    setOptionsText(value);

    const result = parseEditableOptions(value);

    if (result.ok) {
      setManualOptions(result.value);
      setOptionError(null);
      return;
    }

    setOptionError(result.error);
  };

  const refreshAllData = () => {
    setDataDirty(false);
    setManualData(undefined);
    setDataError(null);
    setManualRefreshVersion((value) => value + 1);
  };

  return (
    <div className="example-shell">
      <header className="example-topbar">
        <div>
          <p className="example-kicker">Example and docs</p>
          <h1>@kmsf/charts</h1>
        </div>
        <div className="topbar-actions">
          <Button asChild variant="secondary">
            <a href="#/gridstack">
              <Grid2X2 aria-hidden="true" size={16} />
              Gridstack
            </a>
          </Button>
          <MobileDocsButton activeType={activeType} />
        </div>
      </header>

      <div className="docs-layout">
        <ChartNavigation
          activeType={activeType}
          collapsed={isNavigationCollapsed}
          onCollapseToggle={() => setIsNavigationCollapsed((value) => !value)}
          onSelectType={setActiveType}
        />

        <main aria-label="차트 예제" className="chart-example-main">
          <Card className="chart-stage" data-testid="chart-stage">
            <CardHeader className="chart-stage__header">
              <div>
                <CardTitle>{activeSample.type}</CardTitle>
                <CardDescription>{activeSample.disabledReason ?? activeSample.summary}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="chart-stage__content">
              <div className="chart-viewport">
                {validationMessage ? <div className="chart-validation-message">{validationMessage}</div> : null}
                {activeSample.disabledReason ? (
                  <div className="chart-placeholder">{activeSample.disabledReason}</div>
                ) : (
                  <GenericChart
                    data={sampleData}
                    dataFormat={activeSample.dataFormat}
                    height="100%"
                    legend={optionState.legend}
                    options={sampleOptions}
                    series={sampleSeries}
                    seriesOptions={seriesOptions}
                    themeOverrides={themeOverrides}
                    tooltip={optionState.tooltip}
                    type={activeSample.type}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <section aria-label="차트 옵션 컨트롤" className="option-toolbar">
            <Button variant="outline" onClick={() => setOptionState((state) => ({ ...state, legend: !state.legend }))}>
              <FileText aria-hidden="true" size={16} />
              범례 토글
            </Button>
            <Button variant="outline" onClick={() => setOptionState((state) => ({ ...state, tooltip: !state.tooltip }))}>
              <PanelRight aria-hidden="true" size={16} />
              툴팁 토글
            </Button>
            <Button variant="outline" onClick={refreshAllData}>
              <RefreshCw aria-hidden="true" size={16} />
              전체 데이터 갱신
            </Button>
            <Button
              variant="outline"
              onClick={() => setOptionState((state) => ({ ...state, accentIndex: (state.accentIndex + 1) % 10 }))}
            >
              <Palette aria-hidden="true" size={16} />
              색상 변경
            </Button>
          </section>

          <Tabs className="sample-tabs" defaultValue="data">
            <TabsList aria-label="샘플 정보">
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="code">Usage</TabsTrigger>
            </TabsList>
            <TabsContent value="data">
              <label className="editor-label" htmlFor="chart-data-editor">
                <FileJson aria-hidden="true" size={15} />
                데이터 JSON 편집
              </label>
              <Textarea
                aria-label="데이터 JSON 편집"
                id="chart-data-editor"
                value={dataText}
                onChange={(event) => handleDataTextChange(event.target.value)}
              />
              <pre data-testid="sample-data">{JSON.stringify(sampleSummary, null, 2)}</pre>
            </TabsContent>
            <TabsContent value="options">
              <label className="editor-label" htmlFor="chart-options-editor">
                <FileJson aria-hidden="true" size={15} />
                옵션 JSON 편집
              </label>
              <Textarea
                aria-label="옵션 JSON 편집"
                id="chart-options-editor"
                value={optionsText}
                onChange={(event) => handleOptionsTextChange(event.target.value)}
              />
              <pre data-testid="option-summary">{JSON.stringify(optionSummary, null, 2)}</pre>
            </TabsContent>
            <TabsContent value="code">
              <pre data-testid="sample-code">{usageCode}</pre>
            </TabsContent>
          </Tabs>
        </main>

        <ChartDocsPanel activeType={activeType} />
      </div>
    </div>
  );
}

const dashboardTypes: DashboardChartData[] = [
  { dataFormat: "trend", type: "line" },
  { dataFormat: "top", type: "bar" },
  { dataFormat: "top", type: "pie" },
  { dataFormat: "top", type: "gauge" },
];

const initialDashboardWidgets: DashboardWidget<DashboardChartData>[] = [
  {
    data: dashboardTypes[0],
    id: "trend-widget",
    layout: { h: 3, id: "trend-widget", w: 4, x: 0, y: 0 },
    title: "Trend Line",
  },
  {
    data: dashboardTypes[1],
    id: "top-widget",
    layout: { h: 3, id: "top-widget", w: 4, x: 4, y: 0 },
    title: "Top Bar",
  },
];

function buildDashboardWidget(nextNumber: number): DashboardWidget<DashboardChartData> {
  const chartData = dashboardTypes[nextNumber % dashboardTypes.length]!;
  const id = `chart-widget-${nextNumber}`;

  return {
    data: chartData,
    id,
    layout: { h: 3, id, w: 4, x: 0, y: 0 },
    title: `${chartData.type} ${nextNumber}`,
  };
}

function DashboardChart({ clock, widget }: { clock: SampleClock; widget: DashboardWidget<DashboardChartData> }) {
  const { elementRef, isReady } = useElementReadySize();
  const sample = chartSamples.find((item) => item.type === widget.data?.type) ?? chartSamples[0]!;
  const generatedData = useMemo(() => sample.buildData(clock), [clock, sample]);
  const data = useMemo(() => applyTopRowPalette(generatedData, sample.type), [generatedData, sample.type]);
  const series = useMemo(() => sample.buildSeries?.(clock), [clock, sample]);
  const options = useMemo(() => sample.buildOptions?.(clock), [clock, sample]);
  const seriesOptions = useMemo(
    () => mergeSeriesOptions(sample),
    [sample],
  );

  return (
    <div className="dashboard-chart-body" ref={elementRef}>
      {isReady ? (
        <GenericChart
          data={data}
          dataFormat={sample.dataFormat}
          height="100%"
          options={options}
          series={series}
          seriesOptions={seriesOptions}
          themeOverrides={{ palette: getSeriesPaletteOverride() }}
          type={sample.type}
        />
      ) : null}
    </div>
  );
}

function GridstackPage() {
  const dashboard = useDashboardGrid<DashboardChartData>({
    initialColumns: 12,
    initialWidgets: initialDashboardWidgets,
  });
  const [nextWidgetNumber, setNextWidgetNumber] = useState(3);
  const clock = useSampleClock();

  const addWidget = () => {
    dashboard.commands.addWidget(buildDashboardWidget(nextWidgetNumber));
    setNextWidgetNumber((value) => value + 1);
  };

  return (
    <div className="example-shell">
      <header className="example-topbar">
        <div>
          <p className="example-kicker">Dynamic dashboard sample</p>
          <h1>동적 차트 대시보드</h1>
        </div>
        <div className="topbar-actions">
          <Button asChild variant="secondary">
            <a href="#/">
              <Library aria-hidden="true" size={16} />
              차트 문서
            </a>
          </Button>
          <Button onClick={addWidget}>차트 추가</Button>
          <Button variant="danger" onClick={() => dashboard.commands.clearWidgets()}>
            전체 삭제
          </Button>
        </div>
      </header>

      <Separator />

      <section className="dashboard-summary" aria-label="dashboard status">
        <Badge>위젯 {dashboard.widgets.length}개</Badge>
        <Badge>리사이즈 가능</Badge>
        <Badge>동적 생성/삭제</Badge>
      </section>

      <DashboardGrid
        columns={dashboard.columns}
        movable
        refreshKey={dashboard.refreshVersion}
        resizable
        widgets={dashboard.widgets}
        onMaximizeWidget={dashboard.commands.maximizeWidget}
        onMinimizeWidget={dashboard.commands.minimizeWidget}
        onRemoveWidget={dashboard.commands.removeWidget}
        onRestoreWidget={dashboard.commands.restoreWidget}
        onWidgetHeaderDoubleClick={dashboard.commands.fitWidgetToColumns}
        renderWidget={(widget) => <DashboardChart clock={clock} widget={widget} />}
      />
    </div>
  );
}

export function App() {
  const route = useHashRoute();

  if (route === "/gridstack") {
    return <GridstackPage />;
  }

  return <ChartWorkspacePage />;
}
