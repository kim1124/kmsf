// AI-NOTE: copyDir + glob-style exclude. plan spec의 단순 compilePattern은
// 두 케이스에서 깨지므로 (도메인문서.md §3.1.2):
//   1. `dir/**` 패턴이 dir 자체를 prune 못 함 (빈 디렉터리 남음)
//   2. `**/x` 패턴이 root-level 파일을 매칭 못 함
// 그래서 본 모듈은 input pattern 한 개에서 여러 RegExp variant를 생성한다.
// `tokens.ts`에도 동일 spec 버그 우회 코드가 있음 (tokenizer 방식).
// 두 모듈을 통합하려면 두 동작 모두를 보존하는 regression test 먼저 작성.
//
// EXCLUDE는 POSIX path 기준. Windows 호환성은 미검증.
// symlinks는 명시적으로 skip.

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
