import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

describe("package harness contract", () => {
  it("exposes a full verification script that includes Playwright", () => {
    const packageJson = readJson<{ scripts: Record<string, string> }>(join(packageRoot, "package.json"));

    expect(packageJson.scripts["verify:full"]).toBe(
      "npm run lint && npm run test:run && npm run build && npm run test:e2e",
    );
  });

  it("keeps React as a peer dependency", () => {
    const packageJson = readJson<{
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    }>(join(packageRoot, "package.json"));

    expect(packageJson.peerDependencies?.react).toBeDefined();
    expect(packageJson.peerDependencies?.["react-dom"]).toBeDefined();
    expect(packageJson.dependencies?.react).toBeUndefined();
    expect(packageJson.dependencies?.["react-dom"]).toBeUndefined();
  });

  it("does not import Next.js runtime APIs from package source", () => {
    const sourceFiles = listFiles(join(packageRoot, "src")).filter((path) => /\.(ts|tsx)$/.test(path));
    const offenders = sourceFiles.flatMap((path) => {
      const source = readFileSync(path, "utf8");

      return /from\s+["']next(?:\/|["'])|import\s*\(\s*["']next(?:\/|["'])/.test(source)
        ? [relative(packageRoot, path)]
        : [];
    });

    expect(offenders).toEqual([]);
  });

  it("documents chart acceptance gates for every public chart", () => {
    const matrix = readFileSync(join(packageRoot, "docs/07-acceptance-matrix.md"), "utf8");

    for (const chartName of ["TrendChart", "TopChart", "SankeyChart", "WordCloud", "GuageChart", "SunbustChart"]) {
      expect(matrix).toContain(chartName);
    }

    for (const gateName of ["Vitest", "Playwright", "verify:full", "Residual risk"]) {
      expect(matrix).toContain(gateName);
    }
  });
});
