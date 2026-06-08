import type { EChartsOption, SeriesOption } from "echarts";

import type { GenericChartDataFormat, KmsfChartType } from "../../../src";
import { validateChartConfig } from "../../../src/common/validation";
import { chartSamples } from "./chart-samples";
import type { SampleClock } from "./chart-samples";
import { parseEditableChartData, parseEditableOptions } from "./live-editing";

export interface DashboardWidgetDraft {
  dataFormat: GenericChartDataFormat;
  dataJson: string;
  optionsJson: string;
  seriesJson: string;
  seriesOptionsJson: string;
  title: string;
  type: KmsfChartType;
}

export interface ValidatedDashboardDraft {
  data: unknown;
  options: EChartsOption;
  series: SeriesOption[];
  seriesOptions: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
}

export type DashboardDraftValidationResult =
  | { ok: true; value: ValidatedDashboardDraft }
  | { error: string; ok: false };

const excludedEditorTypes = new Set<KmsfChartType>(["custom", "map"]);

export const dashboardEditorTypes = chartSamples
  .filter((sample) => !excludedEditorTypes.has(sample.type))
  .map((sample) => sample.type);

function stringify(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function buildClock(seed: number): SampleClock {
  return {
    flowTick: seed * 7,
    topTick: seed * 11,
    trendTick: seed * 13,
  };
}

function parseUnknownJson(value: string, fallback: unknown): { ok: true; value: unknown } | { error: string; ok: false } {
  if (!value.trim()) {
    return { ok: true, value: fallback };
  }

  try {
    return { ok: true, value: JSON.parse(value) as unknown };
  } catch {
    return { error: "JSON 형식이 올바르지 않습니다.", ok: false };
  }
}

export function createDashboardDraft({ seed, type }: { seed: number; type?: KmsfChartType }): DashboardWidgetDraft {
  const editorType = type && dashboardEditorTypes.includes(type) ? type : dashboardEditorTypes[seed % dashboardEditorTypes.length]!;
  const sample = chartSamples.find((item) => item.type === editorType)!;
  const clock = buildClock(seed);

  return {
    dataFormat: sample.dataFormat ?? "auto",
    dataJson: stringify(sample.buildData(clock, 3)),
    optionsJson: stringify(sample.buildOptions?.(clock, 3) ?? {}),
    seriesJson: stringify(sample.buildSeries?.(clock, 3) ?? []),
    seriesOptionsJson: stringify(sample.seriesOptions ?? {}),
    title: `${sample.type} widget`,
    type: sample.type,
  };
}

export function validateDashboardDraft(draft: DashboardWidgetDraft): DashboardDraftValidationResult {
  if (!dashboardEditorTypes.includes(draft.type)) {
    return { error: "지원하지 않는 차트 타입입니다.", ok: false };
  }

  const dataResult = parseEditableChartData(draft.dataJson, draft.dataFormat);
  if (!dataResult.ok) {
    return dataResult;
  }

  const optionsResult = parseEditableOptions(draft.optionsJson);
  if (!optionsResult.ok) {
    return optionsResult;
  }

  const seriesResult = parseUnknownJson(draft.seriesJson, []);
  if (!seriesResult.ok) {
    return seriesResult;
  }

  if (!Array.isArray(seriesResult.value)) {
    return { error: "series는 배열이어야 합니다.", ok: false };
  }

  const seriesOptionsResult = parseUnknownJson(draft.seriesOptionsJson, {});
  if (!seriesOptionsResult.ok) {
    return seriesOptionsResult;
  }

  if (!seriesOptionsResult.value || typeof seriesOptionsResult.value !== "object") {
    return { error: "seriesOptions는 객체 또는 배열이어야 합니다.", ok: false };
  }

  const series = seriesResult.value as SeriesOption[];
  const seriesOptions = seriesOptionsResult.value as Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  const validation = validateChartConfig({
    data: dataResult.value,
    options: optionsResult.value,
    series,
    seriesOptions,
    type: draft.type,
  });

  if (!validation.valid) {
    return { error: validation.issues[0]?.message ?? "차트 필수 설정이 누락되었습니다.", ok: false };
  }

  return { ok: true, value: { data: dataResult.value, options: optionsResult.value, series, seriesOptions } };
}
