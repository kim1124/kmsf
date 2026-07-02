import type { KmsfChartType } from "../../../src";
import type { ChartApiFeatureEntry } from "../docs/chart-docs";
import { chartApiFeatureDocs, chartDocs } from "../docs/chart-docs";
import { chartExampleGroups, getExampleUsageCode } from "./chart-examples";

export type ChartSearchKind = "chart-option" | "chart-example" | "chart-doc" | "chart-api";

export interface ChartSearchItem {
  description: string;
  exampleId?: string;
  id: string;
  keywords: string;
  kind: ChartSearchKind;
  path?: string;
  priority: number;
  title: string;
  type: KmsfChartType;
}

export interface ChartRouteTarget {
  exampleId?: string;
  path?: string;
  type: KmsfChartType;
}

const excludedSearchTypes = new Set<KmsfChartType>(["custom", "map"]);

function normalizeSearchText(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value.toLowerCase();
  }

  return JSON.stringify(value).toLowerCase();
}

function joinKeywords(values: unknown[]) {
  return values.map(normalizeSearchText).filter(Boolean).join(" ");
}

export function buildChartPath(target: ChartRouteTarget) {
  if (target.path) {
    return target.path;
  }

  if (target.exampleId) {
    return `/examples/${target.type}#${target.exampleId}`;
  }

  return `/examples/${target.type}`;
}

const docItems: ChartSearchItem[] = chartDocs.map((doc) => ({
  description: `${doc.type} 문서에서 검색 가능한 설명입니다.`,
  id: `${doc.type}:doc`,
  keywords: joinKeywords([doc.type, doc.title, doc.searchText, doc.markdown]),
  kind: "chart-doc",
  priority: 2,
  title: `${doc.type} 문서`,
  type: doc.type,
}));

const optionItems: ChartSearchItem[] = chartDocs.map((doc) => ({
  description: `${doc.type} 문서와 예제에서 사용하는 차트 옵션입니다.`,
  id: `${doc.type}:option`,
  keywords: joinKeywords([doc.type, doc.searchText, doc.markdown, "options seriesOptions legend tooltip"]),
  kind: "chart-option",
  priority: 1,
  title: `${doc.type} 옵션`,
  type: doc.type,
}));

interface ApiSearchEntry extends ChartApiFeatureEntry {
  chartType?: KmsfChartType;
}

const apiItems: ChartSearchItem[] = chartApiFeatureDocs.flatMap((section) => {
  const entries: Array<{ entry: ApiSearchEntry; label: string; priority: number }> = [
    ...section.props.map((entry) => ({ entry: entry as ApiSearchEntry, label: "Props", priority: 1 })),
    ...section.options.map((entry) => ({ entry: entry as ApiSearchEntry, label: "Options", priority: 0 })),
    ...(section.methods ?? []).map((method) => ({
      entry: {
        description: method.description,
        name: method.name,
        type: "method",
      } as ApiSearchEntry,
      label: "Methods",
      priority: 1,
    })),
  ];

  return entries.map(({ entry, label, priority }) => {
    const type: KmsfChartType = entry.chartType ?? "line";

    return {
      description: entry.description,
      id: `${section.id}:${label}:${entry.name}`,
      keywords: joinKeywords([section.title, section.summary, label, entry.name, entry.type, entry.description, "detail" in entry ? entry.detail : ""]),
      kind: "chart-api" as const,
      path: `/api/props#${section.id}`,
      priority,
      title: `${section.title} / ${label} / ${entry.name}`,
      type,
    };
  });
});

const exampleItems: ChartSearchItem[] = Object.values(chartExampleGroups)
  .flatMap((examples) => examples ?? [])
  .map((example) => ({
    description: example.summary,
    exampleId: example.id,
    id: `${example.type}:example:${example.id}`,
    keywords: joinKeywords([
      example.type,
      example.title,
      example.summary,
      example.tags.join(" "),
      example.dataFormat,
      example.seriesOptions,
      getExampleUsageCode(example),
    ]),
    kind: "chart-example",
    priority: 3,
    title: `${example.type} / ${example.title}`,
    type: example.type,
  }));

export const chartSearchItems: ChartSearchItem[] = [...apiItems, ...optionItems, ...docItems, ...exampleItems]
  .filter((item) => !excludedSearchTypes.has(item.type))
  .sort((left, right) => left.priority - right.priority || left.title.localeCompare(right.title));

export function searchCharts(query: string, limit = 10) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return chartSearchItems.filter((item) => item.keywords.includes(normalizedQuery)).slice(0, limit);
}
