import { Highlight, themes } from "prism-react-renderer";

export type CodeBlockLanguage = "bash" | "css" | "json" | "ts" | "tsx";

interface CodeBlockProps {
  code: string;
  id?: string;
  language: CodeBlockLanguage | string;
  testId?: string;
  title?: string;
}

export function CodeBlock({ code, id, language, testId, title }: CodeBlockProps) {
  const label = title ?? `${language} code`;

  return (
    <section aria-label={label} className="docs-code" data-testid={testId} id={id}>
      <div className="docs-code__header">
        <span>{title ?? "Code"}</span>
        <span>{language}</span>
      </div>
      <Highlight code={code.trim()} language={language} theme={themes.github}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} docs-code__pre`} style={style}>
            {tokens.map((line, lineIndex) => (
              <div key={lineIndex} {...getLineProps({ className: "docs-code__line", line })}>
                <span className="docs-code__line-number">{lineIndex + 1}</span>
                <span className="docs-code__line-content">
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </section>
  );
}
