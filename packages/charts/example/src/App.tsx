import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { EChartsOption, SeriesOption } from "echarts";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  Library,
  RefreshCw,
  Search,
} from "lucide-react";
import { DashboardGrid, useDashboardGrid } from "@kmsf/gridstack";
import type { DashboardWidget } from "@kmsf/gridstack";
import { NavLink, useLocation, useNavigate } from "react-router";
import "gridstack/dist/gridstack.min.css";
import "../../../gridstack/src/styles.css";

import { GenericChart, supportedGenericChartTypes } from "../../src";
import type { GenericChartDataFormat, KmsfChartType } from "../../src";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Separator } from "./components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Textarea } from "./components/ui/textarea";
import { ChartSkeleton } from "./components/ChartSkeleton";
import { CodeBlock } from "./components/CodeBlock";
import { ChartExampleCard } from "./components/ChartExampleCard";
import { ChartConfigEditor } from "./components/ChartConfigEditor";
import type { EditableChartConfig } from "./components/ChartConfigEditor";
import { applyTopRowPalette, getSeriesPaletteOverride } from "./data/chart-colors";
import { chartSamples, getUsageCode } from "./data/chart-samples";
import type { ChartSample, SampleClock } from "./data/chart-samples";
import { chartExampleGroups } from "./data/chart-examples";
import type { ChartExampleDefinition } from "./data/chart-examples";
import { buildChartPath, searchCharts } from "./data/chart-search";
import { chartThemeOptions, defaultChartThemeValue, getChartThemeOption } from "./data/chart-themes";
import type { ChartThemeOption, ChartThemeValue } from "./data/chart-themes";
import { chartApiFeatureDocs } from "./docs/chart-docs";
import {
  createDashboardDraft,
  dashboardEditorTypes,
  validateDashboardDraft,
} from "./data/dashboard-widget-editor";
import type { DashboardWidgetDraft, ValidatedDashboardDraft } from "./data/dashboard-widget-editor";

interface DashboardChartData {
  data?: unknown;
  dataFormat?: GenericChartDataFormat;
  options?: EChartsOption;
  series?: SeriesOption[];
  seriesOptions?: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  type: KmsfChartType;
}

function useSampleClock() {
  const [trendTick, setTrendTick] = useState(0);
  const [topTick, setTopTick] = useState(0);
  const [flowTick, setFlowTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTrendTick((value) => value + 1);
      setTopTick((value) => value + 1);
      setFlowTick((value) => value + 1);
    }, 5000);

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

function useSelectedExampleClock(examples: ChartExampleDefinition[]) {
  const [trendTick, setTrendTick] = useState(0);
  const [topTick, setTopTick] = useState(0);
  const [flowTick, setFlowTick] = useState(0);
  const needsLiveUpdate = examples.some((example) => example.mode === "live");

  useEffect(() => {
    if (!needsLiveUpdate) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTrendTick((value) => value + 1);
      setTopTick((value) => value + 1);
      setFlowTick((value) => value + 1);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [needsLiveUpdate]);

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
    navigate(buildChartPath(item));
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
                <Badge>
                  {item.kind === "chart-api" ? "API" : item.kind === "chart-option" ? "옵션" : item.kind === "chart-example" ? "예제" : "문서"}
                </Badge>
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

function ChartExampleContent({ exampleId, themePalette, type }: { exampleId?: string; themePalette?: string[]; type: KmsfChartType }) {
  const examples = chartExampleGroups[type] ?? [];
  const clock = useSelectedExampleClock(examples);
  const location = useLocation();

  useEffect(() => {
    const targetId = exampleId ?? location.hash.replace("#", "");

    if (!targetId) {
      return;
    }

    const element = document.getElementById(targetId);

    if (!element) {
      return;
    }

    element.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [exampleId, location.hash, type]);

  return (
    <section aria-label="차트 예제" className="chart-example-main">
      {examples.length ? (
        <div className="chart-example-list">
          {examples.map((example) => (
            <ChartExampleCard clock={clock} example={example} key={example.id} themePalette={themePalette} />
          ))}
        </div>
      ) : (
        <div className="chart-placeholder">검색 결과가 없습니다.</div>
      )}
    </section>
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

const genericPlaygroundChartTypes = supportedGenericChartTypes.filter((type) => type !== "custom" && type !== "map");

interface ChartTypeSampleState {
  colors: string[];
  data: unknown;
  dataFormat: GenericChartDataFormat;
  disabledReason?: string;
  options: EChartsOption;
  series?: SeriesOption[];
  seriesOptions: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  type: KmsfChartType;
}

function getTypeSampleClock(seed: number): SampleClock {
  return {
    flowTick: seed,
    topTick: seed,
    trendTick: seed,
  };
}

function getGenericSampleSeriesCount(type: KmsfChartType) {
  return type === "line" || type === "scatter" || type === "effectScatter" ? 2 : 1;
}

function buildChartTypeSampleState(type: KmsfChartType, seed = 0): ChartTypeSampleState {
  const sample = chartSamples.find((item) => item.type === type) ?? chartSamples[0]!;
  const clock = getTypeSampleClock(seed);
  const seriesCount = getGenericSampleSeriesCount(type);
  const dataFormat = sample.dataFormat ?? getPlaygroundDataFormat(type);
  const generatedData = sample.buildData(clock, seriesCount);
  const data = applyTopRowPalette(generatedData, type, seed);

  return {
    colors: getSeriesPaletteOverride(seed),
    data,
    dataFormat,
    disabledReason: sample.disabledReason,
    options: sample.buildOptions?.(clock, seriesCount) ?? {},
    series: sample.buildSeries?.(clock, seriesCount),
    seriesOptions: mergeSeriesOptions(sample),
    type,
  };
}

function getGenericUsageCode(state: ChartTypeSampleState) {
  const dataFormatLine = state.dataFormat ? `\n  dataFormat="${state.dataFormat}"` : "";
  const seriesLine = state.series?.length ? "\n  series={series}" : "";
  const seriesOptionsLine = Object.keys(state.seriesOptions as Record<string, unknown>).length ? "\n  seriesOptions={seriesOptions}" : "";
  const optionsLine = Object.keys(state.options).length ? "\n  options={options}" : "";

  return `<GenericChart
  type="${state.type}"
  data={data}${dataFormatLine}${seriesLine}${seriesOptionsLine}${optionsLine}
  colors={colors}
/>`;
}

function TypePlayground({ theme }: { theme: ChartThemeOption }) {
  const [seed, setSeed] = useState(0);
  const [state, setState] = useState(() => buildChartTypeSampleState("bar"));
  const [error, setError] = useState<string | null>(null);
  const editorConfig = useMemo<EditableChartConfig>(
    () => ({
      colors: state.colors,
      data: state.data,
      dataFormat: state.dataFormat,
      options: state.options,
      series: state.series,
      seriesOptions: state.seriesOptions,
      type: state.type,
    }),
    [state],
  );

  const changeType = (nextType: KmsfChartType) => {
    const nextState = buildChartTypeSampleState(nextType, seed + 1);

    setSeed((value) => value + 1);
    setState(nextState);
    setError(null);
  };

  const applyChartConfig = (config: EditableChartConfig) => {
    setState((current) => ({
      colors: config.colors ?? current.colors,
      data: config.data,
      dataFormat: config.dataFormat ?? getPlaygroundDataFormat(config.type),
      options: config.options ?? {},
      series: config.series,
      seriesOptions: config.seriesOptions ?? {},
      type: config.type,
    }));
    setError(null);
  };

  return (
    <section aria-label="Type Playground" className="type-playground-main">
      <Card className="type-playground-card">
        <CardHeader>
          <CardTitle>GenericChart</CardTitle>
          <CardDescription>차트 타입을 변경하면 해당 타입과 호환되는 props를 다시 생성합니다.</CardDescription>
        </CardHeader>
        <CardContent className="type-playground-card__content">
          <label className="type-playground-control">
            <span>Chart type</span>
            <select
              aria-label="Generic chart type"
              value={state.type}
              onChange={(event) => changeType(event.target.value as KmsfChartType)}
            >
              {genericPlaygroundChartTypes.map((chartType) => (
                <option key={chartType} value={chartType}>
                  {chartType}
                </option>
              ))}
            </select>
          </label>
          <span data-testid="generic-chart-format">dataFormat: {state.dataFormat}</span>

          <div className="chart-viewport type-playground-chart">
            {error ? <div className="chart-validation-message" role="alert">{error}</div> : null}
            {state.disabledReason ? (
              <div className="chart-placeholder">{state.disabledReason}</div>
            ) : (
              <GenericChart
                colors={state.colors}
                data={state.data}
                dataFormat={state.dataFormat}
                height="100%"
                key={state.type}
                loadingFallback={<ChartSkeleton />}
                options={state.options}
                series={state.series}
                seriesOptions={state.seriesOptions}
                themeOverrides={{ palette: theme.palette }}
                type={state.type}
              />
            )}
          </div>

          <section aria-label="GenericChart 옵션 컨트롤" className="option-toolbar chart-example-card__toolbar">
            <Button variant="outline" onClick={() => changeType(state.type)}>
              <RefreshCw aria-hidden="true" size={16} />
              샘플 재생성
            </Button>
          </section>

          <Tabs className="sample-tabs" defaultValue="usage">
            <TabsList aria-label="GenericChart 샘플 정보">
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="props">Props</TabsTrigger>
            </TabsList>
            <TabsContent value="usage">
              <CodeBlock code={getGenericUsageCode(state)} language="tsx" testId="sample-code" title="Usage" />
            </TabsContent>
            <TabsContent value="props">
              <ChartConfigEditor
                config={editorConfig}
                id="generic-chart-config-json"
                onChange={applyChartConfig}
                onError={setError}
              />
              <pre data-testid="type-playground-data">{JSON.stringify(state, null, 2)}</pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}

function ThemeExamples({ theme }: { theme: ChartThemeOption }) {
  const lineData = useMemo(
    () => [
      ["09:00", 120],
      ["09:05", 146],
      ["09:10", 132],
      ["09:15", 178],
      ["09:20", 164],
      ["09:25", 196],
    ],
    [],
  );
  const topData = useMemo(
    () => applyTopRowPalette([["Alpha", 120], ["Beta", 96], ["Gamma", 72], ["Delta", 54]], "bar", 0, theme.palette),
    [theme.palette],
  );
  const pieData = useMemo(
    () => applyTopRowPalette([["Direct", 335], ["Search", 310], ["Email", 234], ["Ads", 135]], "pie", 0, theme.palette),
    [theme.palette],
  );

  return (
    <section aria-label="차트 테마 예제" className="theme-example-main">
      <div className="theme-example-status" data-testid="active-chart-theme">
        Active theme: {theme.label}
      </div>
      <div className="theme-example-grid">
        <Card className="theme-example-card" data-testid="theme-example-card-line">
          <CardHeader>
            <CardTitle>Line Theme</CardTitle>
            <CardDescription>선택한 palette가 series color로 적용되는 추이 차트입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-viewport docs-live-chart">
              <GenericChart
                colors={theme.palette}
                data={lineData}
                dataFormat="trend"
                height="100%"
                legend
                loadingFallback={<ChartSkeleton />}
                seriesOptions={{ smooth: true }}
                themeOverrides={{ palette: theme.palette }}
                type="line"
              />
            </div>
          </CardContent>
        </Card>
        <Card className="theme-example-card" data-testid="theme-example-card-bar">
          <CardHeader>
            <CardTitle>Bar Theme</CardTitle>
            <CardDescription>TOP item 색상이 선택한 palette 순서로 반영됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-viewport docs-live-chart">
              <GenericChart
                colors={theme.palette}
                data={topData}
                dataFormat="top"
                height="100%"
                legend={false}
                loadingFallback={<ChartSkeleton />}
                themeOverrides={{ palette: theme.palette }}
                type="bar"
              />
            </div>
          </CardContent>
        </Card>
        <Card className="theme-example-card" data-testid="theme-example-card-pie">
          <CardHeader>
            <CardTitle>Pie Theme</CardTitle>
            <CardDescription>데이터 범례형 차트에서도 같은 palette를 공유합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="chart-viewport docs-live-chart">
              <GenericChart
                colors={theme.palette}
                data={pieData}
                dataFormat="top"
                height="100%"
                legend
                loadingFallback={<ChartSkeleton />}
                themeOverrides={{ palette: theme.palette }}
                type="pie"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

const LARGE_TREND_POINTS = 10_000;
const LARGE_TOP_ITEMS = 1_000;
type LargeTrendRow = [string, number];
type LargeTopRow = [string, number] | [string, number, Record<string, unknown>];

function buildLargeTrendRows(refreshVersion: number): LargeTrendRow[] {
  return Array.from({ length: LARGE_TREND_POINTS }, (_, index) => {
    const value =
      1200 +
      Math.round(Math.sin((index + refreshVersion * 37) / 18) * 460) +
      Math.round(Math.cos((index + refreshVersion * 19) / 41) * 280) +
      ((index * 29 + refreshVersion * 173) % 360);

    return [`T-${String(index + 1).padStart(5, "0")}`, value];
  });
}

function buildLargeTopRows(refreshVersion: number): Array<[string, number]> {
  return Array.from({ length: LARGE_TOP_ITEMS }, (_, index) => [
    `Item ${String(index + 1).padStart(4, "0")}`,
    400 + ((index * 83 + refreshVersion * 997) % 3200),
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

  useEffect(() => {
    const interval = window.setInterval(() => setRefreshVersion((value) => value + 1), 10_000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section aria-label="대용량 데이터 테스트" className="large-data-main">
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
    </section>
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
            <a href="/docs/getting-started">
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


type DocsCodeLanguage = "bash" | "css" | "ts" | "tsx";

type DocsCodeSample = {
  code: string;
  language: DocsCodeLanguage;
  title: string;
};

type ChartsLiveExampleId =
  | "getting-started"
  | "generic-chart"
  | "trend"
  | "top"
  | "theme"
  | "large-data"
  | "dashboard-integration"
  | `chart:${KmsfChartType}`;

type ChartsDocsPage = {
  body: ReactNode;
  category: string;
  codeSamples: DocsCodeSample[];
  label: string;
  liveExampleId?: ChartsLiveExampleId;
  path: string;
  summary: string;
  title: string;
};

const chartsInstallSample = `npm install @kmsf/charts react react-dom`;

const chartsStyleSample = `import "@kmsf/charts/styles.css";`;

const genericChartSample = `import { GenericChart } from "@kmsf/charts";

export function RevenueChart() {
  return (
    <GenericChart
      data={[["Alpha", 120], ["Beta", 96]]}
      dataFormat="top"
      height={320}
      type="bar"
    />
  );
}`;

const trendTopSample = `import { TopChart, TrendChart, createTopRows, createTrendRows } from "@kmsf/charts";

const trendRows = createTrendRows([
  { x: "2026-06-30 10:00:00", value: 120 },
  { x: "2026-06-30 10:01:00", value: 132 },
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
}`;

const nativeRequiredSample = `<GenericChart
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
/>`;

const dashboardIntegrationSample = `import { DashboardGrid, useDashboardGrid } from "@kmsf/gridstack";
import { GenericChart } from "@kmsf/charts";

export function ChartDashboard() {
  const dashboard = useDashboardGrid({ initialColumns: 12, initialWidgets });

  return (
    <DashboardGrid
      columns={dashboard.columns}
      widgets={dashboard.widgets}
      renderWidget={(widget) => <GenericChart {...widget.data} height="100%" />}
    />
  );
}`;

function docsParagraphs(lines: string[]) {
  return (
    <>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </>
  );
}

const nativeOptionHighlights: Partial<Record<KmsfChartType, string[]>> = {
  boxplot: ["xAxis", "yAxis"],
  candlestick: ["xAxis", "yAxis"],
  custom: ["series.renderItem"],
  graph: ["series.links"],
  heatmap: ["visualMap", "xAxis", "yAxis"],
  lines: ["xAxis", "yAxis", "series.coordinateSystem"],
  map: ["registered map resource"],
  parallel: ["parallel", "parallelAxis"],
  radar: ["radar.indicator"],
  sankey: ["series.links"],
  sunburst: ["series.data.children"],
  themeRiver: ["singleAxis"],
  tree: ["series.data.children"],
};

function formatChartTypeTitle(type: KmsfChartType) {
  if (type === "wordCloud") {
    return "WordCloud";
  }

  if (type === "effectScatter") {
    return "Effect Scatter";
  }

  if (type === "themeRiver") {
    return "Theme River";
  }

  if (type === "pictorialBar") {
    return "Pictorial Bar";
  }

  return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

function ChartTypeDocsBody({ sample }: { sample: ChartSample }) {
  const highlights = nativeOptionHighlights[sample.type] ?? [];

  return (
    <>
      <p>{sample.summary}</p>
      <p>이 페이지는 해당 chart type의 실제 렌더링 예제, 사용 코드, 수정 가능한 props를 함께 제공합니다.</p>
      {highlights.length ? (
        <section aria-label={`${sample.type} 필수 Native Options`} className="native-option-callout">
          <strong>필수 Native Options</strong>
          <ul>
            {highlights.map((item) => (
              <li key={item}>
                <code>{item}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

const chartTypeDocsPages: ChartsDocsPage[] = chartSamples.map((sample) => ({
  body: <ChartTypeDocsBody sample={sample} />,
  category: sample.category,
  codeSamples: [{ code: getUsageCode(sample), language: "tsx", title: `${formatChartTypeTitle(sample.type)} usage` }],
  label: formatChartTypeTitle(sample.type),
  liveExampleId: `chart:${sample.type}` as const,
  path: `/examples/${sample.type}`,
  summary: sample.summary,
  title: formatChartTypeTitle(sample.type),
}));

export const chartsDocsPages: ChartsDocsPage[] = [
  {
    body: docsParagraphs([
      "패키지를 설치한 뒤 GenericChart 또는 목적별 wrapper chart를 import합니다.",
      "이 playground는 문서, 코드, 라이브 차트 예제를 같은 route에서 확인하도록 구성합니다.",
    ]),
    category: "시작하기",
    codeSamples: [
      { code: chartsInstallSample, language: "bash", title: "Install" },
      { code: chartsStyleSample, language: "ts", title: "Styles" },
      { code: genericChartSample, language: "tsx", title: "GenericChart" },
    ],
    label: "Getting Started",
    liveExampleId: "getting-started",
    path: "/docs/getting-started",
    summary: "설치, import, 첫 chart 렌더링 흐름을 확인합니다.",
    title: "시작하기",
  },
  {
    body: docsParagraphs(["GenericChart는 type과 dataFormat을 기준으로 ECharts option을 구성하는 범용 entry입니다."]),
    category: "Charts",
    codeSamples: [{ code: genericChartSample, language: "tsx", title: "GenericChart usage" }],
    label: "GenericChart",
    liveExampleId: "generic-chart",
    path: "/examples/generic-chart",
    summary: "지원 chart type을 바꿔가며 GenericChart 렌더링 조건을 확인합니다.",
    title: "GenericChart",
  },
  {
    body: docsParagraphs(["TrendChart는 시간/순서 기반 tuple row와 series를 연결하는 추이 차트 wrapper입니다."]),
    category: "Charts",
    codeSamples: [{ code: trendTopSample, language: "tsx", title: "TrendChart usage" }],
    label: "Trend",
    liveExampleId: "trend",
    path: "/examples/trend",
    summary: "TrendChart와 line 계열 예제를 확인합니다.",
    title: "Trend",
  },
  {
    body: docsParagraphs(["TopChart는 category/value 기반 TOP 데이터를 bar, pie 등으로 표현하는 wrapper입니다."]),
    category: "Charts",
    codeSamples: [{ code: trendTopSample, language: "tsx", title: "TopChart usage" }],
    label: "Top",
    liveExampleId: "top",
    path: "/examples/top",
    summary: "TopChart와 TOP 계열 차트 예제를 확인합니다.",
    title: "Top",
  },
  {
    body: docsParagraphs(["Theme은 top nav의 테마 선택값을 chart palette로 전달해 같은 예제를 다른 색상 체계로 확인하는 playground 전용 예제입니다."]),
    category: "Charts",
    codeSamples: [{ code: genericChartSample, language: "tsx", title: "Theme usage" }],
    label: "Theme",
    liveExampleId: "theme",
    path: "/examples/theme",
    summary: "Basic, Dark, Skyblue, Mint, Gray, Orange chart theme palette를 확인합니다.",
    title: "Theme",
  },
  ...chartTypeDocsPages,
  {
    body: docsParagraphs(["대용량 chart는 일반 예제 탐색과 분리해 렌더링 비용을 명확히 확인합니다."]),
    category: "Performance",
    codeSamples: [{ code: `npm --workspace=@kmsf/charts run test:soak -- --duration 5`, language: "bash", title: "Soak smoke" }],
    label: "Large Data",
    liveExampleId: "large-data",
    path: "/performance/large-data",
    summary: "10,000 point line과 1,000 item bar 렌더링을 확인합니다.",
    title: "Large Data",
  },
  {
    body: docsParagraphs(["Dashboard Integration은 @kmsf/gridstack 위젯 안에서 chart를 렌더링하는 조합 예제입니다."]),
    category: "Integration",
    codeSamples: [{ code: dashboardIntegrationSample, language: "tsx", title: "Chart dashboard" }],
    label: "Dashboard Integration",
    liveExampleId: "dashboard-integration",
    path: "/examples/dashboard-integration",
    summary: "차트 위젯 추가, 삭제, 동적 dashboard 렌더링을 확인합니다.",
    title: "Dashboard Integration",
  },
  {
    body: <ChartsApiReference />,
    category: "API",
    codeSamples: [{ code: genericChartSample, language: "tsx", title: "Primary API" }],
    label: "API",
    path: "/api/props",
    summary: "현재 public chart exports와 usage contract를 정리합니다.",
    title: "API",
  },
];

const chartsDocsNavGroups = chartsDocsPages.reduce<Array<{ category: string; pages: ChartsDocsPage[] }>>((groups, page) => {
  const group = groups.find((item) => item.category === page.category);
  if (group) {
    group.pages.push(page);
    return groups;
  }
  groups.push({ category: page.category, pages: [page] });
  return groups;
}, []);

function ChartsApiReference() {
  return (
    <div className="docs-reference-list">
      {chartApiFeatureDocs.map((section, index) => (
        <section className="docs-reference-list__group" id={section.id} key={section.id}>
          <h2>
            {index + 1}. {section.title}
          </h2>
          <p>{section.summary}</p>
          <section className="docs-reference-list__subsection" aria-label={`${section.title} Props`}>
            <h3>Props</h3>
            <dl>
              {section.props.map((entry) => (
                <div className="docs-reference-list__item" key={`${section.id}-props-${entry.name}`}>
                  <dt>
                    <span>{entry.name}</span>
                    <em>{entry.type}</em>
                  </dt>
                  <dd>
                    <p>{entry.description}</p>
                    {entry.detail ? <small>{entry.detail}</small> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="docs-reference-list__subsection" aria-label={`${section.title} Options`}>
            <h3>Options</h3>
            <dl>
              {section.options.map((entry) => (
                <div className="docs-reference-list__item" key={`${section.id}-options-${entry.name}`}>
                  <dt>
                    <span>{entry.name}</span>
                    <em>{entry.type}</em>
                  </dt>
                  <dd>
                    <p>{entry.description}</p>
                    {entry.detail ? <small>{entry.detail}</small> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          {section.methods?.length ? (
            <section className="docs-reference-list__subsection" aria-label={`${section.title} Methods`}>
              <h3>Methods</h3>
              <dl>
                {section.methods.map((method) => (
                  <div className="docs-reference-list__item" key={`${section.id}-methods-${method.name}`}>
                    <dt>
                      <span>{method.name}</span>
                      <em>method</em>
                    </dt>
                    <dd>
                      <p>{method.description}</p>
                      <small>
                        <strong>파라미터:</strong> {method.params}
                      </small>
                      <small>
                        <strong>리턴값:</strong> {method.returns}
                      </small>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          <section className="docs-reference-list__subsection" aria-label={`${section.title} 예제 코드`}>
            <h3>간단한 예제 코드</h3>
            {section.samples.map((sample) => (
              <div className="docs-reference-list__sample" key={`${section.id}-sample-${sample.title}`}>
                <CodeBlock code={sample.code} language={sample.language} title={sample.title} />
              </div>
            ))}
          </section>
          {section.liveLinks.length ? (
            <section className="docs-reference-list__subsection" aria-label={`${section.title} 라이브 예제`}>
              <h3>라이브 예제</h3>
              <div className="docs-reference-list__links">
                {section.liveLinks.map((link) => (
                  <a className="docs-reference-list__link" href={link.path} key={`${section.id}-${link.path}`}>
                    {link.label}
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      ))}
    </div>
  );
}

export function ChartsDocsShell() {
  const location = useLocation();
  const contentRef = useRef<HTMLElement | null>(null);
  const [themeValue, setThemeValue] = useState<ChartThemeValue>(defaultChartThemeValue);
  const activeTheme = useMemo(() => getChartThemeOption(themeValue), [themeValue]);
  const activePage = chartsDocsPages.find((page) => page.path === location.pathname) ?? chartsDocsPages[0]!;

  useEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    if (!location.hash) {
      content.scrollTo({ left: 0, top: 0 });
      return;
    }

    window.requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));

      if (target) {
        target.scrollIntoView({ block: "start" });
      }
    });
  }, [location.hash, location.pathname]);

  return (
    <div className="docs-shell" data-chart-theme={activeTheme.value}>
      <ChartsDocsTopNav activeTheme={activeTheme} onThemeChange={setThemeValue} />
      <div className="docs-shell__body">
        <ChartsDocsSidebar />
        <main className="docs-shell__content" ref={contentRef}>
          <RouteLifecycleBoundary key={activePage.path} routePath={activePage.path}>
            <ChartsDocsArticle page={activePage} theme={activeTheme} />
          </RouteLifecycleBoundary>
        </main>
      </div>
    </div>
  );
}

function ChartThemeSelect({
  activeTheme,
  onThemeChange,
}: {
  activeTheme: ChartThemeOption;
  onThemeChange: (value: ChartThemeValue) => void;
}) {
  return (
    <label className="chart-theme-select">
      <span>Theme</span>
      <select
        aria-label="차트 테마 선택"
        value={activeTheme.value}
        onChange={(event) => onThemeChange(event.currentTarget.value as ChartThemeValue)}
      >
        {chartThemeOptions.map((theme) => (
          <option key={theme.value} value={theme.value}>
            {theme.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChartsDocsTopNav({
  activeTheme,
  onThemeChange,
}: {
  activeTheme: ChartThemeOption;
  onThemeChange: (value: ChartThemeValue) => void;
}) {
  return (
    <header className="docs-topnav">
      <div className="docs-topnav__brand">
        <p className="docs-topnav__eyebrow">KMSF Playground</p>
        <h1>@kmsf/charts</h1>
      </div>
      <div className="docs-topnav__tools">
        <ChartThemeSelect activeTheme={activeTheme} onThemeChange={onThemeChange} />
        <GlobalChartSearch />
      </div>
    </header>
  );
}

function ChartsDocsSidebar() {
  return (
    <aside aria-label="차트 문서" className="docs-sidebar">
      <div className="docs-sidebar__heading">
        <Library aria-hidden="true" size={16} />
        <strong>문서</strong>
      </div>
      <nav aria-label="문서 메뉴">
        {chartsDocsNavGroups.map((group) => (
          <section className="docs-sidebar__group" key={group.category}>
            <h2>{group.category}</h2>
            <div className="docs-sidebar__links">
              {group.pages.map((page) => (
                <NavLink className="docs-sidebar__link" key={page.path} to={page.path}>
                  {page.label}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}

function ChartsDocsArticle({ page, theme }: { page: ChartsDocsPage; theme: ChartThemeOption }) {
  return (
    <article className="docs-article">
      <header className="docs-article__header">
        <p className="docs-article__eyebrow">{page.category}</p>
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
      </header>

      <section className="docs-article__body">{page.body}</section>

      {page.codeSamples.map((sample) => (
        <ChartsCodeExample key={`${page.path}-${sample.title}`} sample={sample} />
      ))}

      {page.liveExampleId ? <ChartsLiveExampleSection page={page} theme={theme} /> : null}
    </article>
  );
}

function ChartsCodeExample({ sample }: { sample: DocsCodeSample }) {
  return <CodeBlock code={sample.code} language={sample.language} title={sample.title} />;
}

function ChartsLiveExampleSection({ page, theme }: { page: ChartsDocsPage; theme: ChartThemeOption }) {
  return (
    <section aria-label="차트 예제" className="docs-live">
      <div className="docs-live__header">
        <h2>차트 예제</h2>
      </div>
      <ChartsLiveExample id={page.liveExampleId ?? "getting-started"} theme={theme} />
    </section>
  );
}

function ChartsLiveExample({ id, theme }: { id: ChartsLiveExampleId; theme: ChartThemeOption }) {
  if (id === "getting-started") {
    return <GettingStartedChartExample theme={theme} />;
  }

  if (id === "generic-chart") {
    return <TypePlayground theme={theme} />;
  }

  if (id === "trend") {
    return <ChartExampleContent key="trend" themePalette={theme.palette} type="line" />;
  }

  if (id === "top") {
    return <ChartExampleContent key="top" themePalette={theme.palette} type="bar" />;
  }

  if (id === "theme") {
    return <ThemeExamples theme={theme} />;
  }

  if (id === "large-data") {
    return <LargeDataExamples />;
  }

  if (id === "dashboard-integration") {
    return <GridstackPage />;
  }

  if (id.startsWith("chart:")) {
    return <ChartExampleContent key={id} themePalette={theme.palette} type={id.slice("chart:".length) as KmsfChartType} />;
  }

  return <GettingStartedChartExample theme={theme} />;
}

function GettingStartedChartExample({ theme }: { theme: ChartThemeOption }) {
  const data = useMemo(() => applyTopRowPalette([["Alpha", 120], ["Beta", 96], ["Gamma", 72]], "bar", 0, theme.palette), [theme.palette]);

  return (
    <div aria-label="차트 시작 예제" className="docs-live-chart-main">
      <div className="chart-viewport docs-live-chart">
        <GenericChart
          data={data}
          dataFormat="top"
          height="100%"
          loadingFallback={<ChartSkeleton />}
          colors={theme.palette}
          themeOverrides={{ palette: theme.palette }}
          type="bar"
        />
      </div>
    </div>
  );
}

function RouteLifecycleBoundary({ children, routePath }: { children: ReactNode; routePath: string }) {
  const cleanupCountRef = useRef(0);

  useEffect(() => {
    return () => {
      cleanupCountRef.current += 1;
      if (cleanupCountRef.current > 1) {
        window.__kmsfChartsLastUnmount = { routePath };
      }
    };
  }, [routePath]);

  return <>{children}</>;
}

declare global {
  interface Window {
    __kmsfChartsLastUnmount?: { routePath: string } | string;
  }
}

export function App() {
  return <ChartsDocsShell />;
}

export function NotFoundPage() {
  return (
    <div className="example-shell">
      <p className="example-kicker">404</p>
      <h1>지원하지 않는 페이지입니다.</h1>
    </div>
  );
}
