import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { substituteTokens } from "../../src/transforms/tokens";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "kmsf-tokens-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe("substituteTokens", () => {
  it("replaces {{project_name}} in matching files", async () => {
    const f = path.join(workDir, "package.json");
    await writeFile(f, '{"name": "{{project_name}}"}');
    await substituteTokens(workDir, {
      tokens: { project_name: "my-app" },
      include: ["**/*.json"],
    });
    expect(await readFile(f, "utf8")).toBe('{"name": "my-app"}');
  });

  it("does not modify files outside include", async () => {
    const f = path.join(workDir, "skip.txt");
    await writeFile(f, "{{project_name}}");
    await substituteTokens(workDir, {
      tokens: { project_name: "my-app" },
      include: ["**/*.json"],
    });
    expect(await readFile(f, "utf8")).toBe("{{project_name}}");
  });

  it("handles multiple tokens", async () => {
    const f = path.join(workDir, "a.json");
    await writeFile(f, '{"name":"{{project_name}}","author":"{{author}}"}');
    await substituteTokens(workDir, {
      tokens: { project_name: "x", author: "y" },
      include: ["**/*.json"],
    });
    expect(await readFile(f, "utf8")).toBe('{"name":"x","author":"y"}');
  });

  it("recurses into subdirectories", async () => {
    await mkdir(path.join(workDir, "sub"), { recursive: true });
    const f = path.join(workDir, "sub", "x.json");
    await writeFile(f, '{"n":"{{project_name}}"}');
    await substituteTokens(workDir, {
      tokens: { project_name: "ok" },
      include: ["**/*.json"],
    });
    expect(await readFile(f, "utf8")).toBe('{"n":"ok"}');
  });
});
