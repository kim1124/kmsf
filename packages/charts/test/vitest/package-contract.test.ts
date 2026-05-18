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

function readText(path: string): string {
  return readFileSync(path, "utf8");
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
    const matrix = readText(join(packageRoot, "docs/07-acceptance-matrix.md"));

    for (const chartName of ["TrendChart", "TopChart", "SankeyChart", "WordCloud", "GuageChart", "SunbustChart"]) {
      expect(matrix).toContain(chartName);
    }

    for (const gateName of ["Vitest", "Playwright", "verify:full", "Residual risk"]) {
      expect(matrix).toContain(gateName);
    }
  });

  it("keeps agent instruction maps discoverable and bounded", () => {
    const requiredFiles = [
      "GUIDE.md",
      "AGENTS.md",
      "docs/agents/README.md",
      "docs/agents/root/research.md",
      "docs/agents/root/plan.md",
      "docs/agents/root/memory.md",
      "docs/agents/common/research.md",
      "docs/agents/common/plan.md",
      "docs/agents/common/memory.md",
      "docs/agents/components/research.md",
      "docs/agents/components/plan.md",
      "docs/agents/components/memory.md",
      "docs/agents/test/research.md",
      "docs/agents/test/plan.md",
      "docs/agents/test/memory.md",
      "docs/agents/example/research.md",
      "docs/agents/example/plan.md",
      "docs/agents/example/memory.md",
      "src/common/AGENTS.md",
      "src/components/AGENTS.md",
      "test/AGENTS.md",
      "example/AGENTS.md",
    ];

    for (const file of requiredFiles) {
      expect(readText(join(packageRoot, file)), file).toBeTruthy();
    }

    const rootAgents = readText(join(packageRoot, "AGENTS.md"));
    expect(rootAgents).toContain("docs/agents/README.md");
    expect(rootAgents).toContain("GUIDE.md");
    expect(rootAgents).toContain("Superpowers");
    expect(rootAgents).toContain("TDD");
    expect(rootAgents).toContain("verify:full");

    const agentsFiles = [
      join(packageRoot, "AGENTS.md"),
      join(packageRoot, "src/common/AGENTS.md"),
      join(packageRoot, "src/components/AGENTS.md"),
      join(packageRoot, "test/AGENTS.md"),
      join(packageRoot, "example/AGENTS.md"),
    ];

    for (const file of agentsFiles) {
      const lineCount = readText(file).split(/\r?\n/).length;
      expect(lineCount, relative(packageRoot, file)).toBeLessThanOrEqual(100);
    }

    for (const planFile of listFiles(join(packageRoot, "docs/agents")).filter((file) => file.endsWith("/plan.md"))) {
      const lineCount = readText(planFile).split(/\r?\n/).length;
      expect(lineCount, relative(packageRoot, planFile)).toBeLessThanOrEqual(500);
    }
  });
});
