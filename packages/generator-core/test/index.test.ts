import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { scaffold } from "../src/index.js";
import type { ScaffoldLogger } from "../src/types.js";

const spawnSync = vi.hoisted(() => vi.fn().mockReturnValue({ status: 0 }));
vi.mock("node:child_process", () => ({ spawnSync }));

let workDir: string;
let templateDir: string;

const noopLogger: ScaffoldLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  step: () => {},
  debug: () => {},
  stepDone: () => {},
  stepFailed: () => {},
};

async function createMinimalTemplate(root: string): Promise<void> {
  await mkdir(root, { recursive: true });
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "{{project_name}}", version: "0.1.0", dependencies: {} }, null, 2),
  );
  await writeFile(path.join(root, ".env.example"), "KMSF_AUTH_PROVIDER=local-json\n");
  await mkdir(path.join(root, "src/lib/auth"), { recursive: true });
  await writeFile(path.join(root, "src/lib/auth/keep.ts"), "");
}

beforeEach(async () => {
  spawnSync.mockClear();
  workDir = await mkdtemp(path.join(tmpdir(), "kmsf-scaffold-"));
  templateDir = path.join(workDir, "template");
  await createMinimalTemplate(templateDir);
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe("scaffold", () => {
  it("creates project directory with substituted name", async () => {
    const target = path.join(workDir, "my-app");
    const result = await scaffold({
      projectName: "my-app",
      targetDir: target,
      templateDir,
      authMode: "local-json",
      includeI18n: true,
      runInstall: false,
      runGitInit: false,
      runPlaywrightInstall: false,
      packageManager: "npm",
      logger: noopLogger,
    });

    expect(result.projectRoot).toBe(target);
    expect(result.filesCopied).toBeGreaterThan(0);
    const pkg = JSON.parse(await readFile(path.join(target, "package.json"), "utf8"));
    expect(pkg.name).toBe("my-app");
  });

  it("rejects non-empty target", async () => {
    const target = path.join(workDir, "filled");
    await mkdir(target, { recursive: true });
    await writeFile(path.join(target, "x"), "");
    await expect(
      scaffold({
        projectName: "x",
        targetDir: target,
        templateDir,
        authMode: "local-json",
        includeI18n: true,
        runInstall: false,
        runGitInit: false,
        runPlaywrightInstall: false,
        packageManager: "npm",
        logger: noopLogger,
      }),
    ).rejects.toMatchObject({ code: "TargetExists" });
  });

  it("invokes git init when requested", async () => {
    const target = path.join(workDir, "git-app");
    await scaffold({
      projectName: "git-app",
      targetDir: target,
      templateDir,
      authMode: "local-json",
      includeI18n: true,
      runInstall: false,
      runGitInit: false,
      runPlaywrightInstall: false,
      packageManager: "npm",
      logger: noopLogger,
    });
    expect(spawnSync).not.toHaveBeenCalled();

    spawnSync.mockClear();
    const target2 = path.join(workDir, "git-app2");
    await scaffold({
      projectName: "git-app2",
      targetDir: target2,
      templateDir,
      authMode: "local-json",
      includeI18n: true,
      runInstall: false,
      runGitInit: true,
      runPlaywrightInstall: false,
      packageManager: "npm",
      logger: noopLogger,
    });
    expect(spawnSync).toHaveBeenCalled();
  });

  it("removes auth code in none mode", async () => {
    const target = path.join(workDir, "noauth");
    await scaffold({
      projectName: "noauth",
      targetDir: target,
      templateDir,
      authMode: "none",
      includeI18n: true,
      runInstall: false,
      runGitInit: false,
      runPlaywrightInstall: false,
      packageManager: "npm",
      logger: noopLogger,
    });
    await expect(access(path.join(target, "src/lib/auth"))).rejects.toThrow();
  });
});
