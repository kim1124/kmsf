import { useEffect, useMemo, useRef, useState } from "react";
import type { EChartsOption, SeriesOption } from "echarts";
import type { LucideIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
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
  Gauge,
  GitBranch,
  Grid2X2,
  Library,
  Network,
  PanelRight,
  RefreshCw,
  Search,
  Sun,
  TableCellsSplit,
  Workflow,
} from "lucide-react";
import { DashboardGrid, useDashboardGrid } from "@kmsf/gridstack";
import type { DashboardWidget } from "@kmsf/gridstack";
import { Navigate, NavLink, useLocation, useNavigate, useParams } from "react-router";
import "gridstack/dist/gridstack.min.css";
import "@kmsf/gridstack/styles.css";

import { GenericChart, supportedGenericChartTypes } from "../../src";
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
import { ChartSkeleton } from "./components/ChartSkeleton";
import { ChartExampleCard } from "./components/ChartExampleCard";
import { MarkdownDocument } from "./components/MarkdownDocument";
import { applyTopRowPalette, getSeriesPaletteOverride } from "./data/chart-colors";
import { chartSamples } from "./data/chart-samples";
import type { ChartSample, SampleClock } from "./data/chart-samples";
import { chartExampleGroups } from "./data/chart-examples";
import type { ChartExampleDefinition } from "./data/chart-examples";
import { buildChartPath, searchCharts } from "./data/chart-search";
import {
  createDashboardDraft,
  dashboardEditorTypes,
  validateDashboardDraft,
} from "./data/dashboard-widget-editor";
import type { DashboardWidgetDraft, ValidatedDashboardDraft } from "./data/dashboard-widget-editor";
import { buildDocSearchTargets } from "./data/doc-search";
import type { DocSearchTarget } from "./data/doc-search";
import { getChartDoc } from "./docs/chart-docs";

interface DashboardChartData {
  data?: unknown;
  dataFormat?: GenericChartDataFormat;
  options?: EChartsOption;
  series?: SeriesOption[];
  seriesOptions?: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
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

const excludedRouteTypes = new Set<KmsfChartType>(["custom", "map"]);
const routableChartSamples = chartSamples.filter((sample) => !excludedRouteTypes.has(sample.type));

function isChartType(value: string | undefined): value is KmsfChartType {
  return routableChartSamples.some((sample) => sample.type === value);
}

function getRouteChartType(value: string | undefined): KmsfChartType {
  return isChartType(value) ? value : "line";
}

function hasExample(type: KmsfChartType, exampleId: string | undefined) {
  if (!exampleId) {
    return true;
  }

  return Boolean(chartExampleGroups[type]?.some((example) => example.id === exampleId));
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
    const interval = window.setInterval(() => setTopTick((value) => value + 1), 5000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTopTick((value) => value + 1);
      setFlowTick((value) => value + 1);
    }, 10_000);

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

function groupedSamples() {
  const groups = new Map<ChartSample["category"], ChartSample[]>();

  for (const sample of routableChartSamples) {
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
}: {
  activeType: KmsfChartType;
  collapsed: boolean;
  onCollapseToggle: () => void;
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
                  <NavLink
                    aria-label={`${sample.type} 차트 선택`}
                    aria-pressed={activeType === sample.type}
                    className="chart-menu-button"
                    key={sample.type}
                    role="button"
                    title={collapsed ? `${sample.type}: ${sample.summary}` : undefined}
                    to={`/charts/${sample.type}`}
                  >
                    <Icon aria-hidden="true" size={17} />
                    {!collapsed ? (
                      <span className="chart-menu-button__text">
                        <span>{sample.type}</span>
                        <small>{sample.summary}</small>
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}

function useSelectedExampleClock(examples: ChartExampleDefinition[]) {
  const [trendTick, setTrendTick] = useState(0);
  const [topTick, setTopTick] = useState(0);
  const [flowTick, setFlowTick] = useState(0);
  const needsTrend = examples.some((example) => example.mode === "live" && example.updateIntervalMs === 1000);
  const needsTopUpdate = examples.some((example) => example.mode === "live" && example.updateIntervalMs === 5000);
  const needsSlowUpdate = examples.some(
    (example) => example.mode === "live" && example.updateIntervalMs !== 1000 && example.updateIntervalMs !== 5000,
  );

  useEffect(() => {
    if (!needsTrend) {
      return undefined;
    }

    const interval = window.setInterval(() => setTrendTick((value) => value + 1), 1000);

    return () => window.clearInterval(interval);
  }, [needsTrend]);

  useEffect(() => {
    if (!needsTopUpdate) {
      return undefined;
    }

    const interval = window.setInterval(() => setTopTick((value) => value + 1), 5000);

    return () => window.clearInterval(interval);
  }, [needsTopUpdate]);

  useEffect(() => {
    if (!needsSlowUpdate) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTopTick((value) => value + 1);
      setFlowTick((value) => value + 1);
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [needsSlowUpdate]);

  return useMemo<SampleClock>(() => ({ flowTick, topTick, trendTick }), [flowTick, topTick, trendTick]);
}

function GlobalChartSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCharts(query), [query]);

  useEffect(() => {
    setQuery("");
  }, [location.key]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setQuery("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectResult = (item: ReturnType<typeof searchCharts>[number]) => {
    navigate(buildChartPath({ exampleId: item.exampleId, type: item.type }));
    setQuery("");
  };

  return (
    <div className="global-chart-search" ref={rootRef}>
      <div className="example-search">
        <Search aria-hidden="true" size={16} />
        <Input
          aria-controls={query.trim() ? "global-chart-search-results" : undefined}
          aria-expanded={Boolean(query.trim())}
          aria-label="전체 차트 검색"
          placeholder="전체 차트 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuery("");
            }
          }}
        />
      </div>
      {query.trim() ? (
        <div aria-label="전체 차트 검색 결과" className="global-search-popup" id="global-chart-search-results" role="listbox">
          {results.length ? (
            results.map((item) => (
              <button
                aria-label={`${item.type} ${item.title} ${item.description}`}
                className="global-search-popup__item"
                key={item.id}
                role="option"
                type="button"
                onClick={() => selectResult(item)}
              >
                <Badge>{item.kind === "chart-option" ? "옵션" : item.kind === "chart-example" ? "예제" : "문서"}</Badge>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            ))
          ) : (
            <p className="global-search-popup__empty">검색된 결과가 없습니다.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ChartExampleContent({ exampleId, type }: { exampleId?: string; type: KmsfChartType }) {
  const examples = chartExampleGroups[type] ?? [];
  const clock = useSelectedExampleClock(examples);

  useEffect(() => {
    if (!exampleId) {
      return;
    }

    const element = document.querySelector<HTMLElement>(`[data-testid="chart-example-card-${exampleId}"]`);

    if (!element) {
      return;
    }

    element.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [exampleId, type]);

  return (
    <main aria-label="차트 예제" className="chart-example-main">
      <GlobalChartSearch />

      {examples.length ? (
        <div className="chart-example-list">
          {examples.map((example) => (
            <ChartExampleCard clock={clock} example={example} key={example.id} />
          ))}
        </div>
      ) : (
        <div className="chart-placeholder">검색 결과가 없습니다.</div>
      )}
    </main>
  );
}

function ChartDocsPanel({ activeType }: { activeType: KmsfChartType }) {
  const [query, setQuery] = useState("");
  const selectedDoc = getChartDoc(activeType);
  const docSearchTargets = useMemo(() => buildDocSearchTargets(selectedDoc, query), [query, selectedDoc]);

  const selectDocTarget = (target: DocSearchTarget) => {
    document.getElementById(target.id)?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

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
        <section className="docs-section" key={selectedDoc.type}>
          {query && docSearchTargets.length ? (
            <div aria-label="현재 차트 문서 검색 결과" className="docs-search-results" role="listbox">
              {docSearchTargets.map((target) => (
                <button
                  aria-label={`${target.title} ${target.excerpt}`}
                  className="docs-search-results__item"
                  key={target.id}
                  role="option"
                  type="button"
                  onClick={() => selectDocTarget(target)}
                >
                  {target.excerpt}
                </button>
              ))}
            </div>
          ) : null}
          {query && !docSearchTargets.length ? <p className="docs-empty">검색된 결과가 없습니다.</p> : null}
          <MarkdownDocument blockIdPrefix={`doc-block-${selectedDoc.type}`} markdown={selectedDoc.markdown} />
          <a className="official-doc-link" href={selectedDoc.officialDocsUrl} rel="noreferrer" target="_blank">
            ECharts 공식 문서
          </a>
        </section>
      </ScrollArea>
    </aside>
  );
}

function getPlaygroundDataFormat(type: KmsfChartType): GenericChartDataFormat {
  if (type === "line" || type === "scatter" || type === "effectScatter") {
    return "trend";
  }

  if (type === "bar" || type === "pie" || type === "gauge" || type === "funnel" || type === "treemap" || type === "wordCloud") {
    return "top";
  }

  return "native";
}

function TypePlayground() {
  const [type, setType] = useState<KmsfChartType>("bar");
  const [data] = useState(() => [
    ["Alpha", 120],
    ["Beta", 96],
  ]);

  return (
    <main aria-label="Type Playground" className="type-playground-main">
      <Card className="type-playground-card">
        <CardHeader>
          <CardTitle>Type Playground</CardTitle>
          <CardDescription>동일한 데이터를 유지하고 chart type만 변경해 렌더링 조건을 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent className="type-playground-card__content">
          <label className="type-playground-control">
            <span>Chart type</span>
            <select
              aria-label="Chart type"
              value={type}
              onChange={(event) => setType(event.target.value as KmsfChartType)}
            >
              {supportedGenericChartTypes.map((chartType) => (
                <option key={chartType} value={chartType}>
                  {chartType}
                </option>
              ))}
            </select>
          </label>

          <div className="chart-viewport type-playground-chart">
            <GenericChart
              data={data}
              dataFormat={getPlaygroundDataFormat(type)}
              height="100%"
              key={type}
              loadingFallback={<ChartSkeleton />}
              themeOverrides={{ palette: getSeriesPaletteOverride() }}
              type={type}
            />
          </div>

          <pre data-testid="type-playground-data">{JSON.stringify({ data, dataFormat: getPlaygroundDataFormat(type), type }, null, 2)}</pre>
        </CardContent>
      </Card>
    </main>
  );
}

const LARGE_TREND_POINTS = 10_000;
const LARGE_TOP_ITEMS = 1_000;
type LargeTrendRow = [string, number];
type LargeTopRow = [string, number] | [string, number, Record<string, unknown>];

function buildLargeTrendRows(refreshVersion: number): LargeTrendRow[] {
  return Array.from({ length: LARGE_TREND_POINTS }, (_, index) => {
    const value = 800 + Math.round(Math.sin((index + refreshVersion * 11) / 28) * 120) + ((index * 13 + refreshVersion * 31) % 90);

    return [`T-${String(index + 1).padStart(5, "0")}`, value];
  });
}

function buildLargeTopRows(refreshVersion: number): Array<[string, number]> {
  return Array.from({ length: LARGE_TOP_ITEMS }, (_, index) => [
    `Item ${String(index + 1).padStart(4, "0")}`,
    1000 + ((index * 37 + refreshVersion * 113) % 900),
  ]);
}

function LargeDataExamples() {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const trendRows = useMemo(() => buildLargeTrendRows(refreshVersion), [refreshVersion]);
  const topRows = useMemo(
    () => applyTopRowPalette(buildLargeTopRows(refreshVersion), "bar") as LargeTopRow[],
    [refreshVersion],
  );
  const summary = useMemo(
    () => ({
      bar: topRows.length,
      line: trendRows.length,
      refreshVersion,
    }),
    [refreshVersion, topRows.length, trendRows.length],
  );

  return (
    <main aria-label="대용량 데이터 테스트" className="large-data-main">
      <div className="large-data-toolbar">
        <div>
          <h2>대용량 데이터 테스트</h2>
          <p>10,000개 이상 추이 데이터와 1,000개 TOP 데이터를 별도 메뉴에서 렌더링합니다.</p>
        </div>
        <Button variant="outline" onClick={() => setRefreshVersion((value) => value + 1)}>
          <RefreshCw aria-hidden="true" size={16} />
          전체 데이터 갱신
        </Button>
      </div>

      <div className="large-data-grid">
        <Card className="large-data-card" data-testid="large-data-card-line">
          <CardHeader className="chart-example-card__header">
            <div className="chart-example-card__heading">
              <CardTitle>Line 10,000 points</CardTitle>
              <CardDescription>추이 차트 장시간 갱신 검증과 같은 데이터 경로를 대용량으로 확인합니다.</CardDescription>
            </div>
            <div className="chart-example-card__tags">
              <Badge>대용량</Badge>
              <Badge>Trend</Badge>
            </div>
          </CardHeader>
          <CardContent className="large-data-card__content">
            <div className="chart-viewport large-data-chart">
              <GenericChart
                data={trendRows}
                dataFormat="trend"
                height="100%"
                legend={false}
                loadingFallback={<ChartSkeleton />}
                themeOverrides={{ palette: getSeriesPaletteOverride() }}
                tooltip
                type="line"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="large-data-card" data-testid="large-data-card-bar">
          <CardHeader className="chart-example-card__header">
            <div className="chart-example-card__heading">
              <CardTitle>Bar 1,000 items</CardTitle>
              <CardDescription>TOP 계열의 많은 category, 색상 반복, label contraction을 확인합니다.</CardDescription>
            </div>
            <div className="chart-example-card__tags">
              <Badge>대용량</Badge>
              <Badge>TOP</Badge>
            </div>
          </CardHeader>
          <CardContent className="large-data-card__content">
            <div className="chart-viewport large-data-chart">
              <GenericChart
                data={topRows}
                dataFormat="top"
                height="100%"
                labelContraction
                legend={false}
                loadingFallback={<ChartSkeleton />}
                themeOverrides={{ palette: getSeriesPaletteOverride() }}
                tooltip
                type="bar"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <pre className="large-data-summary" data-testid="large-data-summary">
        {`line: ${summary.line}\nbar: ${summary.bar}\nrefreshVersion: ${summary.refreshVersion}`}
      </pre>
    </main>
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

export function ChartWorkspacePage() {
  const params = useParams();
  const activeType = getRouteChartType(params.type);
  const exampleId = params.exampleId;
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);

  if (params.type && !isChartType(params.type)) {
    return <NotFoundPage />;
  }

  if (!hasExample(activeType, exampleId)) {
    return <Navigate replace to="/charts/line" />;
  }

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
          <MobileDocsButton activeType={activeType} key={`mobile-docs-${activeType}`} />
        </div>
      </header>

      <Tabs className="workspace-tabs" defaultValue="examples">
        <div className="workspace-tabs__bar">
          <TabsList aria-label="예제 페이지 보기">
            <TabsTrigger value="examples">Chart Examples</TabsTrigger>
            <TabsTrigger value="type-playground">Type Playground</TabsTrigger>
            <TabsTrigger value="large-data">Large Data</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="examples">
          <div className="docs-layout">
            <ChartNavigation
              activeType={activeType}
              collapsed={isNavigationCollapsed}
              onCollapseToggle={() => setIsNavigationCollapsed((value) => !value)}
            />

            <ChartExampleContent exampleId={exampleId} key={`content-${activeType}`} type={activeType} />

            <ChartDocsPanel activeType={activeType} key={`docs-${activeType}`} />
          </div>
        </TabsContent>

        <TabsContent value="type-playground">
          <TypePlayground />
        </TabsContent>

        <TabsContent value="large-data">
          <LargeDataExamples />
        </TabsContent>
      </Tabs>
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

function buildDashboardWidget(
  nextNumber: number,
  draft?: DashboardWidgetDraft,
  validated?: ValidatedDashboardDraft,
): DashboardWidget<DashboardChartData> {
  const chartData: DashboardChartData =
    draft && validated
      ? {
          dataFormat: draft.dataFormat,
          type: draft.type,
          ...validated,
        }
      : dashboardTypes[nextNumber % dashboardTypes.length]!;
  const id = `chart-widget-${nextNumber}`;

  return {
    data: chartData,
    id,
    layout: { h: 3, id, w: 4, x: 0, y: 0 },
    title: draft?.title || `${chartData.type} ${nextNumber}`,
  };
}

function DashboardChart({ clock, widget }: { clock: SampleClock; widget: DashboardWidget<DashboardChartData> }) {
  const { elementRef, isReady } = useElementReadySize();
  const sample = chartSamples.find((item) => item.type === widget.data?.type) ?? chartSamples[0]!;
  const generatedData = useMemo(() => widget.data?.data ?? sample.buildData(clock), [clock, sample, widget.data]);
  const data = useMemo(() => applyTopRowPalette(generatedData, sample.type), [generatedData, sample.type]);
  const series = useMemo(() => widget.data?.series ?? sample.buildSeries?.(clock), [clock, sample, widget.data]);
  const options = useMemo(() => widget.data?.options ?? sample.buildOptions?.(clock), [clock, sample, widget.data]);
  const seriesOptions = useMemo(
    () => widget.data?.seriesOptions ?? mergeSeriesOptions(sample),
    [sample, widget.data],
  );

  return (
    <div className="dashboard-chart-body" ref={elementRef}>
      {isReady ? (
        <GenericChart
          data={data}
          dataFormat={widget.data?.dataFormat ?? sample.dataFormat}
          height="100%"
          loadingFallback={<ChartSkeleton />}
          options={options}
          series={series?.length ? series : undefined}
          seriesOptions={seriesOptions}
          themeOverrides={{ palette: getSeriesPaletteOverride() }}
          type={sample.type}
        />
      ) : (
        <ChartSkeleton />
      )}
    </div>
  );
}

function DashboardWidgetEditor({
  draft,
  error,
  onChangeDraft,
  onClose,
  onCreate,
  onRegenerate,
  onReset,
}: {
  draft: DashboardWidgetDraft;
  error: string | null;
  onChangeDraft: (draft: DashboardWidgetDraft) => void;
  onClose: () => void;
  onCreate: () => void;
  onRegenerate: (type?: KmsfChartType) => void;
  onReset: () => void;
}) {
  const updateField = (field: keyof DashboardWidgetDraft, value: string) => {
    onChangeDraft({ ...draft, [field]: value });
  };

  return (
    <DialogPrimitive.Content aria-label="차트 위젯 추가" className="ui-card dashboard-editor">
      <CardHeader>
        <div className="dashboard-editor__title">
          <div>
            <DialogPrimitive.Title asChild>
              <CardTitle>차트 위젯 추가</CardTitle>
            </DialogPrimitive.Title>
            <DialogPrimitive.Description asChild>
              <CardDescription>생성 전에 차트 타입, 데이터, 옵션을 검증합니다.</CardDescription>
            </DialogPrimitive.Description>
          </div>
          <Badge>{draft.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="dashboard-editor__content">
        {error ? (
          <div className="dashboard-editor__alert" role="alert">
            {error}
          </div>
        ) : null}

        <div className="dashboard-editor__grid">
          <label className="dashboard-editor__field">
            <span>차트 타입</span>
            <select
              aria-label="차트 타입"
              autoFocus
              value={draft.type}
              onChange={(event) => onRegenerate(event.target.value as KmsfChartType)}
            >
              {dashboardEditorTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-editor__field">
            <span>위젯 제목</span>
            <Input aria-label="위젯 제목" value={draft.title} onChange={(event) => updateField("title", event.target.value)} />
          </label>
          <label className="dashboard-editor__field">
            <span>data JSON</span>
            <Textarea aria-label="data JSON" value={draft.dataJson} onChange={(event) => updateField("dataJson", event.target.value)} />
          </label>
          <label className="dashboard-editor__field">
            <span>options JSON</span>
            <Textarea aria-label="options JSON" value={draft.optionsJson} onChange={(event) => updateField("optionsJson", event.target.value)} />
          </label>
          <label className="dashboard-editor__field">
            <span>series JSON</span>
            <Textarea aria-label="series JSON" value={draft.seriesJson} onChange={(event) => updateField("seriesJson", event.target.value)} />
          </label>
          <label className="dashboard-editor__field">
            <span>seriesOptions JSON</span>
            <Textarea
              aria-label="seriesOptions JSON"
              value={draft.seriesOptionsJson}
              onChange={(event) => updateField("seriesOptionsJson", event.target.value)}
            />
          </label>
        </div>

        <div className="dashboard-editor__actions">
          <Button type="button" variant="outline" onClick={() => onRegenerate(draft.type)}>
            샘플 생성
          </Button>
          <Button type="button" variant="outline" onClick={() => onRegenerate(draft.type)}>
            랜덤 값 갱신
          </Button>
          <Button type="button" variant="secondary" onClick={onReset}>
            초기화
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            닫기
          </Button>
          <Button type="button" onClick={onCreate}>
            위젯 생성
          </Button>
        </div>
      </CardContent>
    </DialogPrimitive.Content>
  );
}

export function GridstackPage() {
  const dashboard = useDashboardGrid<DashboardChartData>({
    initialColumns: 12,
    initialWidgets: initialDashboardWidgets,
  });
  const [nextWidgetNumber, setNextWidgetNumber] = useState(3);
  const [draftSeed, setDraftSeed] = useState(1);
  const [draft, setDraft] = useState(() => createDashboardDraft({ seed: 1 }));
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const clock = useSampleClock();

  const generateDraft = (type?: KmsfChartType) => {
    const nextSeed = draftSeed + 1;
    setDraftSeed(nextSeed);
    setDraft(createDashboardDraft({ seed: nextSeed, type }));
    setEditorError(null);
  };

  const openWidgetEditor = () => {
    generateDraft();
    setIsEditorOpen(true);
  };

  const addWidgetFromDraft = () => {
    const result = validateDashboardDraft(draft);

    if (!result.ok) {
      setEditorError(result.error);
      return;
    }

    dashboard.commands.addWidget(buildDashboardWidget(nextWidgetNumber, draft, result.value));
    setNextWidgetNumber((value) => value + 1);
    setIsEditorOpen(false);
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
          <Button onClick={openWidgetEditor}>차트 추가</Button>
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

      <DialogPrimitive.Root open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="dashboard-editor-backdrop" />
          <DashboardWidgetEditor
            draft={draft}
            error={editorError}
            onChangeDraft={(nextDraft) => {
              setDraft(nextDraft);
              setEditorError(null);
            }}
            onClose={() => setIsEditorOpen(false)}
            onCreate={addWidgetFromDraft}
            onRegenerate={generateDraft}
            onReset={() => generateDraft()}
          />
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

export function App() {
  return <ChartWorkspacePage />;
}

export function NotFoundPage() {
  return (
    <div className="example-shell">
      <p className="example-kicker">404</p>
      <h1>지원하지 않는 페이지입니다.</h1>
    </div>
  );
}
