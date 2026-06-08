export type MarkdownBlockKind = "code" | "heading" | "list" | "paragraph";

export interface MarkdownBlock {
  code?: string;
  id?: string;
  items?: string[];
  kind: MarkdownBlockKind;
  language?: string;
  lineEnd: number;
  lineStart: number;
  lines: string[];
  text: string;
}

function getBlockId(prefix: string | undefined, lineIndex: number) {
  return prefix ? `${prefix}-${lineIndex}` : undefined;
}

export function parseMarkdownBlocks(markdown: string, blockIdPrefix?: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const startIndex = index;
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index]?.startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }

      const endIndex = index;
      blocks.push({
        code: codeLines.join("\n"),
        id: getBlockId(blockIdPrefix, startIndex),
        kind: "code",
        language,
        lineEnd: endIndex,
        lineStart: startIndex,
        lines: codeLines,
        text: codeLines.join("\n"),
      });
      index += 1;
      continue;
    }

    if (line.startsWith("## ") || line.startsWith("# ")) {
      const depth = line.startsWith("## ") ? 3 : 2;
      blocks.push({
        id: getBlockId(blockIdPrefix, index),
        kind: "heading",
        lineEnd: index,
        lineStart: index,
        lines: [line],
        text: line.slice(depth),
      });
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const startIndex = index;
      const items: string[] = [];

      while (index < lines.length && lines[index]?.startsWith("- ")) {
        items.push((lines[index] ?? "").slice(2));
        index += 1;
      }

      blocks.push({
        id: getBlockId(blockIdPrefix, startIndex),
        items,
        kind: "list",
        lineEnd: index - 1,
        lineStart: startIndex,
        lines: items,
        text: items.join("\n"),
      });
      continue;
    }

    blocks.push({
      id: getBlockId(blockIdPrefix, index),
      kind: "paragraph",
      lineEnd: index,
      lineStart: index,
      lines: [line],
      text: line,
    });
    index += 1;
  }

  return blocks;
}
