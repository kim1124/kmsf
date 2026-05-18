import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveScaffoldOptions } from "../src/prompts.js";

const promptMock = vi.hoisted(() => vi.fn());
vi.mock("prompts", () => ({ default: promptMock }));

beforeEach(() => {
  promptMock.mockReset();
});

describe("resolveScaffoldOptions", () => {
  it("uses parsed args when complete (no prompts)", async () => {
    const opts = await resolveScaffoldOptions({
      projectName: "my-app",
      authMode: "local-json",
      includeI18n: true,
      runInstall: true,
      runGitInit: true,
      runPlaywrightInstall: true,
    });
    expect(opts.projectName).toBe("my-app");
    expect(promptMock).not.toHaveBeenCalled();
  });

  it("prompts only for missing values", async () => {
    promptMock.mockResolvedValue({ projectName: "from-prompt" });
    const opts = await resolveScaffoldOptions({
      authMode: "supabase",
      includeI18n: false,
      runInstall: false,
      runGitInit: false,
      runPlaywrightInstall: false,
    });
    expect(opts.projectName).toBe("from-prompt");
    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it("aborts when user presses Ctrl+C (empty answer)", async () => {
    promptMock.mockResolvedValue({});
    await expect(
      resolveScaffoldOptions({ authMode: "none", includeI18n: false }),
    ).rejects.toThrow(/aborted/i);
  });

  it("fails fast in silent mode when required values are missing", async () => {
    promptMock.mockResolvedValue({});

    await expect(
      resolveScaffoldOptions({ projectName: "ci-app", silent: true }),
    ).rejects.toThrow(/--silent/);

    expect(promptMock).not.toHaveBeenCalled();
  });
});
