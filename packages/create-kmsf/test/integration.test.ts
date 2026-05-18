import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM-safe __dirname (B2 fix)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const BIN = path.join(REPO_ROOT, "packages/create-kmsf/bin/create-kmsf.js");

let workDir: string;

beforeAll(async () => {
  // Make sure create-kmsf dist/ is built before invoking the bin wrapper.
  const build = spawnSync(
    "npm",
    ["--workspace=packages/create-kmsf", "run", "build"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  if (build.status !== 0) {
    throw new Error(`create-kmsf build failed: ${build.stderr}`);
  }
  workDir = await mkdtemp(path.join(tmpdir(), "kmsf-integration-"));
});

afterAll(async () => {
  await rm(workDir, { recursive: true, force: true });
});

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

describe("integration smoke", () => {
  it("scaffolds a local-json project end-to-end (no install)", async () => {
    const projectName = "smoke-app";
    const projectPath = path.join(workDir, projectName);

    const result = spawnSync(
      "node",
      [BIN, projectName, "--auth=local-json", "--no-i18n", "--no-install", "--no-git", "--no-playwright", "--silent"],
      { cwd: workDir, encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(await exists(path.join(projectPath, "package.json"))).toBe(true);
    expect(await exists(path.join(projectPath, ".gitignore"))).toBe(true);
    expect(await exists(path.join(projectPath, "gitignore"))).toBe(false);
    expect(await exists(path.join(projectPath, ".env.local"))).toBe(true);
    expect(await exists(path.join(projectPath, "src/lib/auth/local-session.server.ts"))).toBe(true);
    expect(await exists(path.join(projectPath, "src/lib/supabase"))).toBe(false);
    expect(await exists(path.join(projectPath, "src/app/sign-in"))).toBe(false);
    expect(await exists(path.join(projectPath, "proxy.ts"))).toBe(false);
  }, 30000);

  it("scaffolds a none-auth project", async () => {
    const projectName = "no-auth-app";
    const projectPath = path.join(workDir, projectName);

    const result = spawnSync(
      "node",
      [BIN, projectName, "--auth=none", "--no-i18n", "--no-install", "--no-git", "--no-playwright", "--silent"],
      { cwd: workDir, encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(await exists(path.join(projectPath, "src/lib/auth"))).toBe(false);
    expect(await exists(path.join(projectPath, "src/components/auth"))).toBe(false);
  }, 30000);

  it("rejects non-empty target", async () => {
    const projectName = "smoke-app"; // already exists from first test
    const result = spawnSync(
      "node",
      [BIN, projectName, "--auth=local-json", "--no-i18n", "--no-install", "--no-git", "--no-playwright", "--silent"],
      { cwd: workDir, encoding: "utf8" },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/not empty/i);
  }, 15000);
});
