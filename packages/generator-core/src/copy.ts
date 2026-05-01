import { mkdir, readdir, copyFile, stat } from "node:fs/promises";
import path from "node:path";

export interface CopyOptions {
  /** Glob-like patterns matched against POSIX-style paths relative to src. */
  exclude: string[];
}

export interface CopyResult {
  fileCount: number;
}

/**
 * Convert a glob pattern to one or more RegExps. Supports `*`, `**`, and
 * literal segments. Patterns are matched against POSIX-style relative paths.
 *
 * Gitignore-flavored conveniences:
 *  - `dir/**` also matches `dir` itself, so the directory is pruned.
 *  - `**\/x` also matches `x` at the root (zero leading segments).
 */
function compilePattern(pattern: string): RegExp[] {
  // Variants of the raw glob pattern, before regex translation.
  const variants = new Set<string>([pattern]);
  if (pattern.endsWith("/**")) {
    variants.add(pattern.slice(0, -"/**".length));
  }
  if (pattern.startsWith("**/")) {
    variants.add(pattern.slice("**/".length));
  }

  return Array.from(variants).map((variant) => {
    // Escape regex metacharacters except * and /
    const escaped = variant.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    // ** → match any path segments; * → match any chars except /
    const regex = escaped
      .replace(/\*\*/g, "::DOUBLESTAR::")
      .replace(/\*/g, "[^/]*")
      .replace(/::DOUBLESTAR::/g, ".*");
    return new RegExp(`^${regex}$`);
  });
}

function isExcluded(relPath: string, patternGroups: RegExp[][]): boolean {
  const posix = relPath.split(path.sep).join("/");
  return patternGroups.some((group) => group.some((p) => p.test(posix)));
}

export async function copyDir(
  srcDir: string,
  dstDir: string,
  options: CopyOptions,
): Promise<CopyResult> {
  const patternGroups = options.exclude.map(compilePattern);
  await mkdir(dstDir, { recursive: true });

  let fileCount = 0;

  async function walk(src: string, dst: string, rel: string): Promise<void> {
    const entries = await readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      const srcPath = path.join(src, entry.name);
      const dstPath = path.join(dst, entry.name);

      if (isExcluded(childRel, patternGroups)) {
        continue;
      }

      if (entry.isDirectory()) {
        await mkdir(dstPath, { recursive: true });
        await walk(srcPath, dstPath, childRel);
      } else if (entry.isFile()) {
        await copyFile(srcPath, dstPath);
        fileCount += 1;
      }
      // symlinks and other types intentionally skipped
    }
  }

  const srcStat = await stat(srcDir);
  if (!srcStat.isDirectory()) {
    throw new Error(`copyDir source is not a directory: ${srcDir}`);
  }
  await walk(srcDir, dstDir, "");

  return { fileCount };
}
