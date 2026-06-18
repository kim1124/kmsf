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
      selectedPackages: [],
      gnbRegions: ["top", "left", "footer"],
    });
    expect(opts.projectName).toBe("my-app");
    expect(opts.selectedPackages).toEqual([]);
    expect(opts.gnbRegions).toEqual(["top", "left", "footer"]);
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
      selectedPackages: [],
      gnbRegions: ["top", "left"],
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

  it("fails fast in silent mode when package selection is missing", async () => {
    promptMock.mockResolvedValue({});

    await expect(
      resolveScaffoldOptions({
        projectName: "ci-app",
        authMode: "local-json",
        includeI18n: true,
        runInstall: false,
        runGitInit: false,
        runPlaywrightInstall: false,
        gnbRegions: ["top", "left"],
        silent: true,
      }),
    ).rejects.toThrow(/--packages or --no-packages/);

    expect(promptMock).not.toHaveBeenCalled();
  });

  it("fails fast in silent mode when layout selection is missing", async () => {
    promptMock.mockResolvedValue({});

    await expect(
      resolveScaffoldOptions({
        projectName: "ci-app",
        authMode: "local-json",
        includeI18n: true,
        runInstall: false,
        runGitInit: false,
        runPlaywrightInstall: false,
        selectedPackages: [],
        silent: true,
      }),
    ).rejects.toThrow(/--layout/);

    expect(promptMock).not.toHaveBeenCalled();
  });

  it("prompts for package selection with an empty default", async () => {
    promptMock.mockResolvedValue({
      selectedPackages: ["charts", "gridstack"],
    });

    const opts = await resolveScaffoldOptions({
      projectName: "my-app",
      authMode: "later",
      includeI18n: true,
      runInstall: false,
      runGitInit: false,
      runPlaywrightInstall: false,
      gnbRegions: ["top", "left", "footer"],
    });

    expect(opts.selectedPackages).toEqual(["charts", "gridstack"]);
    expect(promptMock).toHaveBeenCalledTimes(1);
    expect(promptMock.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        type: "multiselect",
        name: "selectedPackages",
      }),
    ]);
  });

  it("prompts for GNB layout regions with top, left, and footer selected by default", async () => {
    promptMock.mockResolvedValue({
      gnbRegions: ["right"],
    });

    const opts = await resolveScaffoldOptions({
      projectName: "my-app",
      authMode: "later",
      includeI18n: true,
      runInstall: false,
      runGitInit: false,
      runPlaywrightInstall: false,
      selectedPackages: [],
    });

    expect(opts.gnbRegions).toEqual(["right"]);
    expect(promptMock).toHaveBeenCalledTimes(1);
    expect(promptMock.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        type: "multiselect",
        name: "gnbRegions",
        choices: expect.arrayContaining([
          expect.objectContaining({ value: "top", selected: true }),
          expect.objectContaining({ value: "left", selected: true }),
          expect.objectContaining({ value: "right", selected: false }),
          expect.objectContaining({ value: "footer", selected: true }),
        ]),
      }),
    ]);
  });
});
