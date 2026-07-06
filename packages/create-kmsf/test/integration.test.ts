import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, access, readFile } from "node:fs/promises";
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

async function readJson<T>(p: string): Promise<T> {
  return JSON.parse(await readFile(p, "utf8")) as T;
}

describe("integration smoke", () => {
  it("scaffolds a local-json project end-to-end (no install)", async () => {
    const projectName = "smoke-app";
    const projectPath = path.join(workDir, projectName);

    const result = spawnSync(
      "node",
      [BIN, projectName, "--auth=local-json", "--layout=top,left,footer", "--no-i18n", "--no-packages", "--no-install", "--no-git", "--no-playwright", "--silent"],
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
    expect(await exists(path.join(projectPath, "src/app/(protected)/settings/page.tsx"))).toBe(true);
    expect(await exists(path.join(projectPath, "proxy.ts"))).toBe(false);
    expect(await exists(path.join(projectPath, "messages/en.json"))).toBe(false);
    expect(await exists(path.join(projectPath, "src/components/layout/_components/language-toggle.tsx"))).toBe(false);

    const generatedPackage = await readJson<{ scripts?: Record<string, string> }>(
      path.join(projectPath, "package.json"),
    );
    expect(generatedPackage.scripts?.verify).not.toContain("language-toggle.spec.ts");
    await expect(readFile(path.join(projectPath, "src/lib/layout/gnb-layout-config.ts"), "utf8")).resolves.toContain(
      '["top", "left", "footer"]',
    );

    const localJsonOnlyFiles = [
      "src/app/page.tsx",
      "src/app/(protected)/actions.ts",
      "src/app/(protected)/layout.tsx",
      "src/app/(public)/sign-in/actions.ts",
      "src/app/(public)/sign-up/page.tsx",
      "src/lib/auth/session.ts",
      "src/lib/security/csrf.ts",
    ];

    for (const rel of localJsonOnlyFiles) {
      const content = await readFile(path.join(projectPath, rel), "utf8");

      expect(content).not.toContain("@/lib/supabase");
      expect(content).not.toContain("google-identity");
    }

    await expect(
      readFile(path.join(projectPath, "src/app/(public)/sign-up/page.tsx"), "utf8"),
    ).resolves.not.toContain("params");
  }, 30000);

  it("scaffolds a none-auth project", async () => {
    const projectName = "no-auth-app";
    const projectPath = path.join(workDir, projectName);

    const result = spawnSync(
      "node",
      [BIN, projectName, "--auth=none", "--layout=top,left,footer", "--no-i18n", "--no-packages", "--no-install", "--no-git", "--no-playwright", "--silent"],
      { cwd: workDir, encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(await exists(path.join(projectPath, "src/lib/auth"))).toBe(false);
    expect(await exists(path.join(projectPath, "src/components/auth"))).toBe(false);
  }, 30000);

  it("scaffolds a later-auth project with selected KMSF package dependencies", async () => {
    const projectName = "later-package-app";
    const projectPath = path.join(workDir, projectName);

    const result = spawnSync(
      "node",
      [BIN, projectName, "--auth=later", "--layout=top,left,footer", "--i18n", "--packages=charts,gridstack", "--no-install", "--no-git", "--no-playwright", "--silent"],
      { cwd: workDir, encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(await exists(path.join(projectPath, "src/lib/supabase"))).toBe(true);
    expect(await exists(path.join(projectPath, "src/lib/auth/providers/local-json-auth-store.ts"))).toBe(true);

    const envLocal = await readFile(path.join(projectPath, ".env.local"), "utf8");
    expect(envLocal).toContain("KMSF_AUTH_PROVIDER=later");
    expect(envLocal).toMatch(/KMSF_LOCAL_AUTH_SESSION_SECRET=[a-f0-9]{64}/);

    const generatedPackage = await readJson<{
      dependencies?: Record<string, string>;
    }>(path.join(projectPath, "package.json"));
    expect(generatedPackage.dependencies).toMatchObject({
      "@kmsf/charts": "^0.1.0",
      "@kmsf/gridstack": "^1.0.0",
      "@supabase/ssr": expect.any(String),
      "@supabase/supabase-js": expect.any(String),
    });
  }, 30000);

  it("rejects non-empty target", async () => {
    const projectName = "smoke-app"; // already exists from first test
    const result = spawnSync(
      "node",
      [BIN, projectName, "--auth=local-json", "--layout=top,left,footer", "--no-i18n", "--no-packages", "--no-install", "--no-git", "--no-playwright", "--silent"],
      { cwd: workDir, encoding: "utf8" },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/not empty/i);
  }, 15000);

  it("rejects unsupported auth mode for react-vite-base", async () => {
    const result = spawnSync(
      "node",
      [
        BIN,
        "bad-vite-auth",
        "--template=react-vite-base",
        "--auth=local-json",
        "--layout=top,left",
        "--i18n",
        "--no-packages",
        "--no-install",
        "--no-git",
        "--no-playwright",
        "--silent",
      ],
      { cwd: workDir, encoding: "utf8" },
    );

    expect(result.status).toBe(3);
    expect(result.stderr).toMatch(/auth mode local-json is not supported by template react-vite-base/i);
  }, 15000);

  it("scaffolds a react-vite-base project without auth", async () => {
    const projectName = "vite-app";
    const projectPath = path.join(workDir, projectName);

    const result = spawnSync(
      "node",
      [
        BIN,
        projectName,
        "--template=react-vite-base",
        "--auth=none",
        "--layout=top,left,footer",
        "--i18n",
        "--no-packages",
        "--no-install",
        "--no-git",
        "--no-playwright",
        "--silent",
      ],
      { cwd: workDir, encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(await exists(path.join(projectPath, "package.json"))).toBe(true);
    expect(await exists(path.join(projectPath, "index.html"))).toBe(true);
    expect(await exists(path.join(projectPath, "vite.config.ts"))).toBe(true);
    expect(await exists(path.join(projectPath, "src/main.tsx"))).toBe(true);
    expect(await exists(path.join(projectPath, "src/routes/router.tsx"))).toBe(true);
    expect(await exists(path.join(projectPath, "src/auth"))).toBe(false);
    expect(await exists(path.join(projectPath, "next.config.ts"))).toBe(false);
    expect(await exists(path.join(projectPath, "src/app"))).toBe(false);

    const generatedPackage = await readJson<{ scripts?: Record<string, string> }>(
      path.join(projectPath, "package.json"),
    );
    expect(generatedPackage.scripts?.dev).toBe("vite");
    expect(generatedPackage.scripts?.build).toContain("vite build");
  }, 30000);
});
