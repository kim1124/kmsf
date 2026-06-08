import type { KmsfChartType } from "../../../src";
import type { ChartDoc } from "../docs/chart-docs";
import { parseMarkdownBlocks } from "./markdown-blocks";

export interface DocSearchTarget {
  excerpt: string;
  id: string;
  lineIndex: number;
  title: string;
  type: KmsfChartType;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function cleanExcerpt(value: string) {
  return value.replace(/^#+\s*/, "").replace(/^-\s*/, "");
}

export function buildDocSearchTargets(doc: ChartDoc, query: string, limit = 10): DocSearchTarget[] {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  return parseMarkdownBlocks(doc.markdown, `doc-block-${doc.type}`)
    .map((block) => {
      const matchedLine = block.lines.find((line) => normalize(line).includes(normalizedQuery));

      return { block, matchedLine };
    })
    .filter((item) => item.matchedLine && item.block.id)
    .slice(0, limit)
    .map((item) => ({
      excerpt: cleanExcerpt(item.matchedLine ?? item.block.text),
      id: item.block.id!,
      lineIndex: item.block.lineStart,
      title: `${doc.type} 문서`,
      type: doc.type,
    }));
}
