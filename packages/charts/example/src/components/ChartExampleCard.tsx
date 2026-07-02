import { useEffect, useMemo, useState } from "react";
import type { EChartsOption, SeriesOption } from "echarts";
import {
  FileText,
  PanelRight,
  RefreshCw,
} from "lucide-react";

import { GenericChart } from "../../../src";
import type { KmsfChartType } from "../../../src";
import type { SampleClock } from "../data/chart-samples";
import {
  clampExampleSeriesCount,
  getExampleUsageCode,
} from "../data/chart-examples";
import type { ChartExampleDefinition } from "../data/chart-examples";
import { applyTopRowPalette, getSeriesPaletteOverride } from "../data/chart-colors";
import { ChartConfigEditor } from "./ChartConfigEditor";
import type { EditableChartConfig } from "./ChartConfigEditor";
import { ChartSkeleton } from "./ChartSkeleton";
import { CodeBlock } from "./CodeBlock";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface LocalOptionState {
  legend: boolean;
  tooltip: boolean;
}

interface ChartExampleCardProps {
  clock: SampleClock;
  example: ChartExampleDefinition;
  themePalette?: string[];
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

function mergeSeriesOptions(
  example: ChartExampleDefinition,
): Partial<SeriesOption> | Array<Partial<SeriesOption>> {
  if (Array.isArray(example.seriesOptions)) {
    return example.seriesOptions;
  }

  return example.seriesOptions ?? {};
}

function buildEditableConfig(input: {
  colors: string[];
  data: unknown;
  dataFormat?: EditableChartConfig["dataFormat"];
  options?: EChartsOption;
  series?: SeriesOption[];
  seriesOptions: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  type: KmsfChartType;
}): EditableChartConfig {
  return {
    colors: input.colors,
    data: input.data,
    dataFormat: input.dataFormat,
    options: input.options,
    series: input.series,
    seriesOptions: input.seriesOptions,
    type: input.type,
  };
}

export function ChartExampleCard({ clock, example, themePalette }: ChartExampleCardProps) {
  const initialSeriesCount = clampExampleSeriesCount(example.defaultSeriesCount ?? 1);
  const [optionState, setOptionState] = useState<LocalOptionState>(() => ({
    legend: getInitialLegendState(example.type),
    tooltip: true,
  }));
  const [seriesCount] = useState(() => initialSeriesCount);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [editableConfig, setEditableConfig] = useState<EditableChartConfig | null>(null);
  const [configDirty, setConfigDirty] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
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
    () => applyTopRowPalette(generatedData, example.type, 0, themePalette),
    [example.type, generatedData, themePalette],
  );
  const generatedSeries = useMemo(() => example.buildSeries?.(context), [context, example]);
  const generatedOptions = useMemo(() => example.buildOptions?.(context), [context, example]);
  const generatedSeriesOptions = useMemo(() => mergeSeriesOptions(example), [example]);
  const generatedColors = useMemo(() => (themePalette?.length ? themePalette : getSeriesPaletteOverride(0)), [themePalette]);
  const generatedConfig = useMemo(
    () =>
      buildEditableConfig({
        colors: generatedColors,
        data: coloredGeneratedData,
        dataFormat: example.dataFormat ?? "auto",
        options: generatedOptions,
        series: generatedSeries,
        seriesOptions: generatedSeriesOptions,
        type: example.type,
      }),
    [coloredGeneratedData, example.dataFormat, example.type, generatedColors, generatedOptions, generatedSeries, generatedSeriesOptions],
  );
  const currentConfig = configDirty && !configError && editableConfig ? editableConfig : generatedConfig;
  const sampleType = currentConfig.type;
  const sampleData = currentConfig.data;
  const sampleSeries = currentConfig.series;
  const sampleOptions = currentConfig.options;
  const seriesOptions = currentConfig.seriesOptions ?? {};
  const sampleColors = currentConfig.colors ?? generatedColors;
  const themeOverrides = useMemo(
    () => ({ palette: sampleColors }),
    [sampleColors],
  );
  const validationMessage = configError;
  const usageCode = useMemo(() => getExampleUsageCode(example), [example]);

  useEffect(() => {
    if (!configDirty) {
      setEditableConfig(generatedConfig);
    }
  }, [configDirty, generatedConfig]);

  const refreshData = () => {
    setConfigDirty(false);
    setEditableConfig(null);
    setConfigError(null);
    setRefreshVersion((value) => value + 1);
  };

  const handleConfigChange = (nextConfig: EditableChartConfig) => {
    setConfigDirty(true);
    setEditableConfig(nextConfig);
    setConfigError(null);
  };

  const lockedLiveEditorReason = example.mode === "live" ? "실시간 데이터는 예제 생성기가 관리합니다." : undefined;

  return (
    <Card className="chart-example-card" data-testid={`chart-example-card-${example.id}`} id={example.id}>
      <CardHeader className="chart-example-card__header">
        <div className="chart-example-card__heading">
          <CardTitle>{example.title}</CardTitle>
          <CardDescription>{example.summary}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="chart-example-card__content">
        <div className="chart-viewport" data-testid="chart-stage">
          {validationMessage ? <div className="chart-validation-message" role="alert">{validationMessage}</div> : null}
          {example.disabledReason ? (
            <div className="chart-placeholder">{example.disabledReason}</div>
          ) : (
            <GenericChart
              colors={sampleColors}
              data={sampleData}
              dataFormat={currentConfig.dataFormat}
              height="100%"
              legend={optionState.legend}
              loadingFallback={<ChartSkeleton />}
              options={sampleOptions}
              series={sampleSeries}
              seriesOptions={seriesOptions}
              themeOverrides={themeOverrides}
              tooltip={optionState.tooltip}
              type={sampleType}
            />
          )}
        </div>

        <section aria-label={`${example.title} 차트 옵션 컨트롤`} className="option-toolbar chart-example-card__toolbar">
          <Button
            aria-pressed={optionState.legend}
            className="chart-option-toggle"
            data-state={optionState.legend ? "on" : "off"}
            variant="outline"
            onClick={() => setOptionState((state) => ({ ...state, legend: !state.legend }))}
          >
            <FileText aria-hidden="true" size={16} />
            {optionState.legend ? "범례 숨김" : "범례 표시"}
          </Button>
          <Button
            aria-pressed={optionState.tooltip}
            className="chart-option-toggle"
            data-state={optionState.tooltip ? "on" : "off"}
            variant="outline"
            onClick={() => setOptionState((state) => ({ ...state, tooltip: !state.tooltip }))}
          >
            <PanelRight aria-hidden="true" size={16} />
            {optionState.tooltip ? "툴팁 숨김" : "툴팁 표시"}
          </Button>
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw aria-hidden="true" size={16} />
            전체 데이터 갱신
          </Button>
        </section>

        <Tabs className="sample-tabs" defaultValue="usage">
          <TabsList aria-label={`${example.title} 샘플 정보`}>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="props">Props</TabsTrigger>
          </TabsList>
          <TabsContent value="usage">
            <CodeBlock code={usageCode} language="tsx" testId="sample-code" title="Usage" />
          </TabsContent>
          <TabsContent value="props">
            <ChartConfigEditor
              config={editableConfig ?? currentConfig}
              disabledReason={lockedLiveEditorReason}
              id={`${example.id}-chart-config-json`}
              onChange={handleConfigChange}
              onError={setConfigError}
            />
          </TabsContent>
        </Tabs>

        <span className="sr-only" data-testid="series-count-summary">
          series-count: {seriesCount}
        </span>
      </CardContent>
    </Card>
  );
}
