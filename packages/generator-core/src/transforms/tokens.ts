import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface SubstituteOptions {
  /** Map of token name → replacement value. Token syntax: {{name}}. */
  tokens: Record<string, string>;
  /** Glob patterns of files to process. */
  include: string[];
}

function compilePattern(pattern: string): RegExp {
  let regex = "";
  let i = 0;
  while (i < pattern.length) {
    if (pattern.startsWith("**/", i)) {
      regex += "(?:.*/)?";
      i += 3;
    } else if (pattern.startsWith("**", i)) {
      regex += ".*";
      i += 2;
    } else if (pattern[i] === "*") {
      regex += "[^/]*";
      i += 1;
    } else {
      regex += pattern[i].replace(/[.+^${}()|[\]\\]/g, "\\$&");
      i += 1;
    }
  }
  return new RegExp(`^${regex}$`);
}

function matchesAny(rel: string, patterns: RegExp[]): boolean {
  const posix = rel.split(path.sep).join("/");
  return patterns.some((p) => p.test(posix));
}

function applyTokens(content: string, tokens: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (full, name: string) => {
    return Object.prototype.hasOwnProperty.call(tokens, name) ? tokens[name] : full;
  });
}

export async function substituteTokens(
  rootDir: string,
  options: SubstituteOptions,
): Promise<{ filesModified: number }> {
  const patterns = options.include.map(compilePattern);
  let filesModified = 0;

  async function walk(dir: string, rel: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, childRel);
      } else if (entry.isFile() && matchesAny(childRel, patterns)) {
        const content = await readFile(fullPath, "utf8");
        const next = applyTokens(content, options.tokens);
        if (next !== content) {
          await writeFile(fullPath, next, "utf8");
          filesModified += 1;
        }
      }
    }
  }

  await walk(rootDir, "");
  return { filesModified };
}
