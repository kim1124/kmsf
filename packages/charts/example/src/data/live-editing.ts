import type { EChartsOption } from "echarts";

import type { GenericChartDataFormat } from "../../../src";

export type ParseResult<TValue> =
  | { ok: true; value: TValue }
  | { error: string; ok: false };

const allowedOptionKeys = new Set([
  "aria",
  "color",
  "dataZoom",
  "grid",
  "legend",
  "parallel",
  "parallelAxis",
  "radar",
  "series",
  "singleAxis",
  "title",
  "toolbox",
  "tooltip",
  "visualMap",
  "xAxis",
  "yAxis",
]);

function isTupleRows(value: unknown): value is unknown[][] {
  return Array.isArray(value) && value.every((row) => Array.isArray(row) && row.length >= 2);
}

function parseJson(value: string): ParseResult<unknown> {
  try {
    return { ok: true, value: JSON.parse(value) as unknown };
  } catch {
    return { error: "JSON 형식이 올바르지 않습니다.", ok: false };
  }
}

export function parseEditableOptions(value: string): ParseResult<EChartsOption> {
  const parsed = parseJson(value);

  if (!parsed.ok) {
    return parsed;
  }

  if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
    return { error: "허용되지 않는 옵션입니다.", ok: false };
  }

  const hasUnsupportedKey = Object.keys(parsed.value).some((key) => !allowedOptionKeys.has(key));

  if (hasUnsupportedKey) {
    return { error: "허용되지 않는 옵션입니다.", ok: false };
  }

  return { ok: true, value: parsed.value as EChartsOption };
}

export function parseEditableChartData(
  value: string,
  format: GenericChartDataFormat | undefined,
): ParseResult<unknown> {
  const parsed = parseJson(value);

  if (!parsed.ok) {
    return parsed;
  }

  if (format === "top" || format === "trend") {
    return isTupleRows(parsed.value)
      ? { ok: true, value: parsed.value }
      : { error: "허용되지 않는 데이터입니다.", ok: false };
  }

  return { ok: true, value: parsed.value };
}
