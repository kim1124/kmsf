import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readProjectSetupConfig, writeProjectSetupConfig } from "./project-setup-config";

let cwd: string;
const originalCwd = process.cwd();
const originalSetupConfigFile = process.env.KMSF_SETUP_CONFIG_FILE;

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), "kmsf-setup-config-"));
  process.chdir(cwd);
  process.env.KMSF_SETUP_CONFIG_FILE = "setup.test.json";
});

afterEach(async () => {
  process.chdir(originalCwd);
  if (originalSetupConfigFile === undefined) {
    delete process.env.KMSF_SETUP_CONFIG_FILE;
  } else {
    process.env.KMSF_SETUP_CONFIG_FILE = originalSetupConfigFile;
  }
  await rm(cwd, { force: true, recursive: true });
});

describe("project setup config", () => {
  it("writes the selected GNB layout regions", async () => {
    await writeProjectSetupConfig("local-json", { enabledRegions: ["right", "footer"] });

    const config = await readProjectSetupConfig();
    const raw = JSON.parse(await readFile(join(cwd, ".local", "setup.test.json"), "utf8"));

    expect(config?.gnbLayout.enabledRegions).toEqual(["right", "footer"]);
    expect(raw.gnbLayout.enabledRegions).toEqual(["right", "footer"]);
  });

  it("falls back to top, left, and footer when layout regions are missing", async () => {
    await writeProjectSetupConfig("supabase");

    const config = await readProjectSetupConfig();

    expect(config?.gnbLayout.enabledRegions).toEqual(["top", "left", "footer"]);
  });
});
