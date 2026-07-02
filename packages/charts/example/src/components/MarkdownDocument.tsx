import type { ReactElement } from "react";

import { parseMarkdownBlocks } from "../data/markdown-blocks";
import { CodeBlock } from "./CodeBlock";

interface MarkdownDocumentProps {
  blockIdPrefix?: string;
  markdown: string;
}

function renderInlineText(text: string) {
  const parts = text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }

    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (linkMatch) {
      return (
        <a href={linkMatch[2]} key={`${part}-${index}`} rel="noreferrer" target="_blank">
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

export function MarkdownDocument({ blockIdPrefix, markdown }: MarkdownDocumentProps) {
  const blocks: ReactElement[] = [];
  const sourceLines = markdown.split("\n");

  for (const block of parseMarkdownBlocks(markdown, blockIdPrefix)) {
    if (block.kind === "code") {
      blocks.push(
        <CodeBlock
          code={block.code ?? ""}
          id={block.id}
          key={`code-${block.lineStart}`}
          language={block.language ?? "tsx"}
          testId={block.id}
        />,
      );
      continue;
    }

    if (block.kind === "heading" && sourceLines[block.lineStart]?.startsWith("## ")) {
      blocks.push(
        <h2 data-testid={block.id} id={block.id} key={`h2-${block.lineStart}`}>
          {block.text}
        </h2>,
      );
      continue;
    }

    if (block.kind === "heading") {
      blocks.push(
        <h1 data-testid={block.id} id={block.id} key={`h1-${block.lineStart}`}>
          {block.text}
        </h1>,
      );
      continue;
    }

    if (block.kind === "list") {
      blocks.push(
        <ul data-testid={block.id} id={block.id} key={`list-${block.lineStart}`}>
          {(block.items ?? []).map((item) => (
            <li key={item}>{renderInlineText(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    blocks.push(
      <p data-testid={block.id} id={block.id} key={`p-${block.lineStart}`}>
        {renderInlineText(block.text)}
      </p>,
    );
  }

  return <article className="markdown-document">{blocks}</article>;
}
