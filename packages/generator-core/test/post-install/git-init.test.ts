import { describe, it, expect, vi, beforeEach } from "vitest";
import { runGitInit } from "../../src/post-install/git-init.js";

const spawnSync = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ spawnSync }));

beforeEach(() => {
  spawnSync.mockReset();
});

describe("runGitInit", () => {
  it("runs init, add, commit on success", async () => {
    spawnSync.mockReturnValue({ status: 0, stdout: "", stderr: "" });
    const result = await runGitInit("/tmp/proj");
    expect(result.success).toBe(true);
    expect(spawnSync).toHaveBeenCalledTimes(3);
    expect(spawnSync.mock.calls[0][0]).toBe("git");
    expect(spawnSync.mock.calls[0][1]).toEqual(["init"]);
  });

  it("returns failure when git not available", async () => {
    spawnSync.mockReturnValue({ status: null, error: { code: "ENOENT" } });
    const result = await runGitInit("/tmp/proj");
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/not found/i);
  });

  it("returns failure on non-zero status", async () => {
    spawnSync.mockReturnValueOnce({ status: 0 }); // init
    spawnSync.mockReturnValueOnce({ status: 0 }); // add
    spawnSync.mockReturnValueOnce({ status: 1, stderr: "commit failed" }); // commit
    const result = await runGitInit("/tmp/proj");
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/commit failed/);
  });
});
