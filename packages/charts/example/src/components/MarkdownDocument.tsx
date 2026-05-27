import type { ReactElement } from "react";

interface MarkdownDocumentProps {
  markdown: string;
}

function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}

export function MarkdownDocument({ markdown }: MarkdownDocumentProps) {
  const blocks: ReactElement[] = [];
  const lines = markdown.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index]?.startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }

      blocks.push(
        <pre className="markdown-code" key={`code-${index}`} data-language={language}>
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(<h2 key={`h2-${index}`}>{line.slice(3)}</h2>);
      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(<h1 key={`h1-${index}`}>{line.slice(2)}</h1>);
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];

      while (index < lines.length && lines[index]?.startsWith("- ")) {
        items.push((lines[index] ?? "").slice(2));
        index += 1;
      }

      blocks.push(
        <ul key={`list-${index}`}>
          {items.map((item) => (
            <li key={item}>{renderInlineCode(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    blocks.push(<p key={`p-${index}`}>{renderInlineCode(line)}</p>);
    index += 1;
  }

  return <article className="markdown-document">{blocks}</article>;
}
