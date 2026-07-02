import { useEffect, useState } from "react";
import type { EChartsOption, SeriesOption } from "echarts";
import { FileJson } from "lucide-react";

import type { GenericChartDataFormat, KmsfChartType } from "../../../src";
import { Textarea } from "./ui/textarea";

export interface EditableChartConfig {
  colors?: string[];
  data: unknown;
  dataFormat?: GenericChartDataFormat;
  options?: EChartsOption;
  series?: SeriesOption[];
  seriesOptions?: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  type: KmsfChartType;
}

export interface ChartConfigEditorProps {
  config: EditableChartConfig;
  disabledReason?: string;
  id: string;
  onChange: (nextConfig: EditableChartConfig) => void;
  onError: (message: string | null) => void;
}

const blockedTypes = new Set<KmsfChartType>(["custom", "map"]);

function stringifyConfig(config: EditableChartConfig) {
  return JSON.stringify(config, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isChartType(value: unknown): value is KmsfChartType {
  return typeof value === "string";
}

function parseConfig(value: string): { config: EditableChartConfig; ok: true } | { message: string; ok: false } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return { message: "JSON 형식이 올바르지 않습니다.", ok: false };
  }

  if (!isRecord(parsed) || !isChartType(parsed.type) || !("data" in parsed)) {
    return { message: "허용되지 않는 옵션입니다.", ok: false };
  }

  if (blockedTypes.has(parsed.type)) {
    return { message: "허용되지 않는 옵션입니다.", ok: false };
  }

  return { config: parsed as unknown as EditableChartConfig, ok: true };
}

export function ChartConfigEditor({ config, disabledReason, id, onChange, onError }: ChartConfigEditorProps) {
  const [text, setText] = useState(() => stringifyConfig(config));

  useEffect(() => {
    setText(stringifyConfig(config));
  }, [config]);

  if (disabledReason) {
    return (
      <div className="chart-example-card__locked-editor" role="note">
        {disabledReason}
      </div>
    );
  }

  return (
    <>
      <label className="editor-label" htmlFor={id}>
        <FileJson aria-hidden="true" size={15} />
        Chart config JSON
      </label>
      <Textarea
        aria-label="Chart config JSON"
        className="chart-config-editor__textarea"
        id={id}
        value={text}
        onChange={(event) => {
          const nextText = event.target.value;
          setText(nextText);

          const result = parseConfig(nextText);

          if (!result.ok) {
            onError(result.message);
            return;
          }

          onError(null);
          onChange(result.config);
        }}
      />
    </>
  );
}
