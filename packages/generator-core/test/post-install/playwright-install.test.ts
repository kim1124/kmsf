import { describe, it, expect, vi, beforeEach } from "vitest";
import { runPlaywrightInstall } from "../../src/post-install/playwright-install.js";

const spawnSync = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ spawnSync }));

beforeEach(() => {
  spawnSync.mockReset();
});

describe("runPlaywrightInstall", () => {
  it("runs npx playwright install on success", async () => {
    spawnSync.mockReturnValue({ status: 0 });
    const result = await runPlaywrightInstall("/tmp/proj");
    expect(result.success).toBe(true);
    expect(spawnSync.mock.calls[0][0]).toBe("npx");
    expect(spawnSync.mock.calls[0][1]).toEqual(["playwright", "install"]);
  });

  it("returns failure on non-zero", async () => {
    spawnSync.mockReturnValue({ status: 1, stderr: "boom" });
    const result = await runPlaywrightInstall("/tmp/proj");
    expect(result.success).toBe(false);
    expect(result.reason).toContain("boom");
  });
});
