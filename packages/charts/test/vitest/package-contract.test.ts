import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const packagesRoot = dirname(packageRoot);
const repoRoot = dirname(packagesRoot);

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

    expect(packageJson.scripts.verify).toBe("npm run lint && npm run test:run && npm run build");
    expect(packageJson.scripts["verify:e2e"]).toBe("npm run test:e2e");
    expect(packageJson.scripts["verify:full"]).toBe("npm run verify && npm run verify:e2e");
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

    for (const chartName of ["GenericChart", "TrendChart", "TopChart", "SankeyChart", "WordCloud", "GaugeChart", "SunburstChart"]) {
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
      "README.md",
      "docs/README.md",
      "docs/01-requirements.md",
      "docs/02-architecture.md",
      "docs/03-component-api-draft.md",
      "docs/04-verification-strategy.md",
      "docs/05-open-questions.md",
      "docs/06-quick-start.md",
      "docs/07-acceptance-matrix.md",
      "src/common/AGENTS.md",
      "src/components/AGENTS.md",
      "test/AGENTS.md",
      "example/AGENTS.md",
    ];

    for (const file of requiredFiles) {
      expect(readText(join(packageRoot, file)), file).toBeTruthy();
    }

    const packageAgents = readText(join(packageRoot, "AGENTS.md"));
    const rootAgents = readText(join(repoRoot, "AGENTS.md"));
    expect(packageAgents).toContain("docs/README.md");
    expect(packageAgents).toContain("GUIDE.md");
    expect(rootAgents).toContain("Superpowers TDD");
    expect(rootAgents).toContain("test-driven-development");
    expect(packageAgents).toContain("verify:full");

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
  });

  it("keeps package instruction routing centralized in the repo root", () => {
    const rootAgents = readText(join(repoRoot, "AGENTS.md"));
    expect(rootAgents).toContain("이 계약은 `apps/*`, `packages/*`, `examples/*`, `templates/*`에 모두 적용된다.");
    expect(rootAgents).toContain("하위 `AGENTS.md`에 공통 규칙을 반복하지 않는다.");
    expect(rootAgents).toContain("## Skill Routing");
    expect(rootAgents).toContain(".agents/skills/delivery");
    expect(rootAgents).toContain("`code-review`");
    expect(rootAgents).toContain("`code-health`");
    expect(rootAgents).toContain("`test-gate`");
    expect(rootAgents).toContain("package 변경은 각 package의 `AGENTS.md`와 `test/AGENTS.md`");
    expect(existsSync(join(packagesRoot, "AGENTS.md"))).toBe(false);

    const packageAgentFiles = readdirSync(packagesRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => join(packagesRoot, entry.name, "AGENTS.md"));

    for (const file of packageAgentFiles) {
      const content = readText(file);
      expect(content, relative(repoRoot, file)).toMatch(/(?:Root|repo root) `AGENTS\.md`/);
      expect(content, relative(repoRoot, file)).toMatch(/(?:(?:공통|common) .*상속|`packages\/\*` 하위 프로젝트에도 공통 적용)/);
      expect(content, relative(repoRoot, file)).not.toContain("## Process Routing");
    }
  });

  it("does not load gridstack playground styles through dist-only package exports", () => {
    const appSource = readText(join(packageRoot, "example/src/App.tsx"));

    expect(appSource).toContain('import "../../../gridstack/src/styles.css";');
    expect(appSource).not.toContain('import "@kmsf/gridstack/styles.css";');
  });
});
