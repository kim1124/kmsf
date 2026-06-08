import { useEffect, useMemo, useState } from "react";
import type { EChartsOption, SeriesOption } from "echarts";
import {
  FileJson,
  FileText,
  Palette,
  PanelRight,
  RefreshCw,
} from "lucide-react";

import { GenericChart } from "../../../src";
import type { SampleClock } from "../data/chart-samples";
import {
  clampExampleSeriesCount,
  getExampleUsageCode,
} from "../data/chart-examples";
import type { ChartExampleDefinition } from "../data/chart-examples";
import { applyTopRowPalette, getSeriesPaletteOverride } from "../data/chart-colors";
import { parseEditableChartData, parseEditableOptions } from "../data/live-editing";
import { ChartSkeleton } from "./ChartSkeleton";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

interface LocalOptionState {
  legend: boolean;
  tooltip: boolean;
}

interface ChartExampleCardProps {
  clock: SampleClock;
  example: ChartExampleDefinition;
}

const hiddenLegendExampleTypes = new Set([
  "bar",
  "funnel",
  "gauge",
  "heatmap",
  "pictorialBar",
  "sankey",
  "sunburst",
  "treemap",
  "wordCloud",
]);

export function getInitialLegendState(type: string) {
  return !hiddenLegendExampleTypes.has(type);
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
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

function mergeSeriesOptions(
  example: ChartExampleDefinition,
): Partial<SeriesOption> | Array<Partial<SeriesOption>> {
  if (Array.isArray(example.seriesOptions)) {
    return example.seriesOptions;
  }

  return example.seriesOptions ?? {};
}

function buildOptionSummary(input: {
  options?: EChartsOption;
  seriesCount: number;
  seriesOptions: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  state: LocalOptionState;
  themeOverrides: { palette: string[] };
}) {
  return {
    legend: input.state.legend,
    options: input.options,
    seriesCount: input.seriesCount,
    seriesOptions: input.seriesOptions,
    themeOverrides: input.themeOverrides,
    tooltip: input.state.tooltip,
  };
}

export function ChartExampleCard({ clock, example }: ChartExampleCardProps) {
  const initialSeriesCount = clampExampleSeriesCount(example.defaultSeriesCount ?? 1);
  const [optionState, setOptionState] = useState<LocalOptionState>(() => ({
    legend: getInitialLegendState(example.type),
    tooltip: true,
  }));
  const [seriesCount, setSeriesCount] = useState(() => initialSeriesCount);
  const [seriesCountText, setSeriesCountText] = useState(() => String(initialSeriesCount));
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [accentIndex, setAccentIndex] = useState(0);
  const [dataText, setDataText] = useState("");
  const [dataDirty, setDataDirty] = useState(false);
  const [manualData, setManualData] = useState<unknown>();
  const [dataError, setDataError] = useState<string | null>(null);
  const [optionsText, setOptionsText] = useState("");
  const [optionDirty, setOptionDirty] = useState(false);
  const [manualOptions, setManualOptions] = useState<EChartsOption>({});
  const [optionError, setOptionError] = useState<string | null>(null);
  const context = useMemo(
    () => ({
      clock,
      refreshVersion,
      seriesCount,
    }),
    [clock, refreshVersion, seriesCount],
  );
  const generatedData = useMemo(() => example.buildData(context), [context, example]);
  const coloredGeneratedData = useMemo(
    () => applyTopRowPalette(generatedData, example.type, accentIndex),
    [accentIndex, example.type, generatedData],
  );
  const sampleData = dataDirty && !dataError ? manualData : coloredGeneratedData;
  const sampleSeries = useMemo(() => example.buildSeries?.(context), [context, example]);
  const generatedOptions = useMemo(() => example.buildOptions?.(context), [context, example]);
  const sampleOptions = useMemo(
    () =>
      mergePlainObjects(
        (generatedOptions ?? {}) as Record<string, unknown>,
        manualOptions as Record<string, unknown>,
      ) as EChartsOption,
    [generatedOptions, manualOptions],
  );
  const seriesOptions = useMemo(() => mergeSeriesOptions(example), [example]);
  const themeOverrides = useMemo(
    () => ({ palette: getSeriesPaletteOverride(accentIndex) }),
    [accentIndex],
  );
  const optionSummary = useMemo(
    () => buildOptionSummary({ options: sampleOptions, seriesCount, seriesOptions, state: optionState, themeOverrides }),
    [optionState, sampleOptions, seriesCount, seriesOptions, themeOverrides],
  );
  const sampleSummary = useMemo(
    () => ({
      data: sampleData,
      dataFormat: example.dataFormat ?? "auto",
      options: sampleOptions,
      series: sampleSeries,
      seriesCount,
      seriesOptions,
      type: example.type,
    }),
    [example, sampleData, sampleOptions, sampleSeries, seriesCount, seriesOptions],
  );
  const validationMessage = optionError ?? dataError;
  const usageCode = useMemo(() => getExampleUsageCode(example), [example]);

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

    const result = parseEditableChartData(value, example.dataFormat);

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

  const commitSeriesCount = (value: string) => {
    const nextSeriesCount = clampExampleSeriesCount(Number(value));

    setSeriesCount(nextSeriesCount);
    setSeriesCountText(String(nextSeriesCount));
  };

  const handleSeriesCountChange = (value: string) => {
    setSeriesCountText(value);

    if (value.trim() === "") {
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    const nextSeriesCount = clampExampleSeriesCount(numericValue);

    setSeriesCount(nextSeriesCount);

    if (numericValue < 1 || numericValue > 10) {
      setSeriesCountText(String(nextSeriesCount));
    }
  };

  const refreshData = () => {
    setDataDirty(false);
    setManualData(undefined);
    setDataError(null);
    setRefreshVersion((value) => value + 1);
  };

  return (
    <Card className="chart-example-card" data-testid={`chart-example-card-${example.id}`}>
      <CardHeader className="chart-example-card__header">
        <div className="chart-example-card__heading">
          <CardTitle>{example.title}</CardTitle>
          <CardDescription>{example.summary}</CardDescription>
        </div>
        <div className="chart-example-card__tags">
          {example.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="chart-example-card__content">
        <div className="chart-viewport" data-testid="chart-stage">
          {validationMessage ? <div className="chart-validation-message">{validationMessage}</div> : null}
          {example.disabledReason ? (
            <div className="chart-placeholder">{example.disabledReason}</div>
          ) : (
            <GenericChart
              data={sampleData}
              dataFormat={example.dataFormat}
              height="100%"
              legend={optionState.legend}
              loadingFallback={<ChartSkeleton />}
              options={sampleOptions}
              series={sampleSeries}
              seriesOptions={seriesOptions}
              themeOverrides={themeOverrides}
              tooltip={optionState.tooltip}
              type={example.type}
            />
          )}
        </div>

        <section aria-label={`${example.title} 차트 옵션 컨트롤`} className="option-toolbar chart-example-card__toolbar">
          <Button variant="outline" onClick={() => setOptionState((state) => ({ ...state, legend: !state.legend }))}>
            <FileText aria-hidden="true" size={16} />
            범례 토글
          </Button>
          <Button variant="outline" onClick={() => setOptionState((state) => ({ ...state, tooltip: !state.tooltip }))}>
            <PanelRight aria-hidden="true" size={16} />
            툴팁 토글
          </Button>
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw aria-hidden="true" size={16} />
            전체 데이터 갱신
          </Button>
          <Button variant="outline" onClick={() => setAccentIndex((value) => (value + 1) % 10)}>
            <Palette aria-hidden="true" size={16} />
            색상 변경
          </Button>
          {example.seriesCountEnabled ? (
            <label className="series-count-control">
              <span>Series</span>
              <Input
                aria-label={`${example.title} Series 개수`}
                max={10}
                min={1}
                type="number"
                value={seriesCountText}
                onBlur={(event) => commitSeriesCount(event.currentTarget.value)}
                onChange={(event) => handleSeriesCountChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitSeriesCount(event.currentTarget.value);
                  }
                }}
              />
            </label>
          ) : null}
        </section>

        <Tabs className="sample-tabs" defaultValue="data">
          <TabsList aria-label={`${example.title} 샘플 정보`}>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="code">Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="data">
            <label className="editor-label" htmlFor={`${example.id}-data-editor`}>
              <FileJson aria-hidden="true" size={15} />
              데이터 JSON 편집
            </label>
            <Textarea
              aria-label="데이터 JSON 편집"
              id={`${example.id}-data-editor`}
              value={dataText}
              onChange={(event) => handleDataTextChange(event.target.value)}
            />
            <pre data-testid="sample-data">{JSON.stringify(sampleSummary, null, 2)}</pre>
          </TabsContent>
          <TabsContent value="options">
            <label className="editor-label" htmlFor={`${example.id}-options-editor`}>
              <FileJson aria-hidden="true" size={15} />
              옵션 JSON 편집
            </label>
            <Textarea
              aria-label="옵션 JSON 편집"
              id={`${example.id}-options-editor`}
              value={optionsText}
              onChange={(event) => handleOptionsTextChange(event.target.value)}
            />
            <pre data-testid="option-summary">{JSON.stringify(optionSummary, null, 2)}</pre>
          </TabsContent>
          <TabsContent value="code">
            <pre data-testid="sample-code">{usageCode}</pre>
          </TabsContent>
        </Tabs>

        <span className="sr-only" data-testid="series-count-summary">
          series-count: {seriesCount}
        </span>
      </CardContent>
    </Card>
  );
}
