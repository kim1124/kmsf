import { describe, it, expect, vi, beforeEach } from "vitest";
import { runInstall, detectPackageManager } from "../../src/post-install/npm-install";

const spawnSync = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ spawnSync }));

beforeEach(() => {
  spawnSync.mockReset();
});

describe("detectPackageManager", () => {
  it("detects pnpm from user agent", () => {
    expect(detectPackageManager("pnpm/8.15.0 npm/?")).toBe("pnpm");
  });
  it("detects yarn", () => {
    expect(detectPackageManager("yarn/4.0.0 npm/?")).toBe("yarn");
  });
  it("falls back to npm", () => {
    expect(detectPackageManager(undefined)).toBe("npm");
    expect(detectPackageManager("npm/10.0.0 node/v20")).toBe("npm");
  });
});

describe("runInstall", () => {
  it("runs `npm install` for npm", async () => {
    spawnSync.mockReturnValue({ status: 0 });
    const result = await runInstall("/tmp/proj", "npm");
    expect(result.success).toBe(true);
    expect(spawnSync.mock.calls[0][0]).toBe("npm");
    expect(spawnSync.mock.calls[0][1]).toEqual(["install"]);
  });

  it("runs `pnpm install` for pnpm", async () => {
    spawnSync.mockReturnValue({ status: 0 });
    await runInstall("/tmp/proj", "pnpm");
    expect(spawnSync.mock.calls[0][0]).toBe("pnpm");
  });

  it("returns failure on non-zero status", async () => {
    spawnSync.mockReturnValue({ status: 1, stderr: "ERR" });
    const result = await runInstall("/tmp/proj", "npm");
    expect(result.success).toBe(false);
    expect(result.reason).toContain("ERR");
  });

  it("returns failure when binary missing", async () => {
    spawnSync.mockReturnValue({ status: null, error: { code: "ENOENT" } });
    const result = await runInstall("/tmp/proj", "yarn");
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/yarn not found/i);
  });
});
