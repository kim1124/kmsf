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
  it("writes a project setup profile with independent DB, auth, settings, menu, and layout choices", async () => {
    await writeProjectSetupConfig({
      appConfigStorageMode: "local-storage",
      authMode: "manual",
      dbMode: "none",
      gnbLayout: { enabledRegions: [] },
      menuSourceMode: "manual",
    });

    const config = await readProjectSetupConfig();
    const raw = JSON.parse(await readFile(join(cwd, ".local", "setup.test.json"), "utf8"));

    expect(config).toMatchObject({
      appConfigStorageMode: "local-storage",
      authMode: "manual",
      authProvider: "local-json",
      dbMode: "none",
      gnbLayout: { enabledRegions: [] },
      menuSourceMode: "manual",
      version: 2,
    });
    expect(raw.gnbLayout.enabledRegions).toEqual([]);
  });

  it("keeps the initial setup default layout separate from explicit empty regions", async () => {
    await writeProjectSetupConfig({
      appConfigStorageMode: "connected-db",
      authMode: "kmsf-managed",
      dbMode: "dev-local-db",
      menuSourceMode: "app-routes",
    });

    const config = await readProjectSetupConfig();

    expect(config?.gnbLayout.enabledRegions).toEqual(["top", "left"]);
  });

  it("reads legacy provider configs as a v2 kmsf-managed setup profile", async () => {
    await writeProjectSetupConfig("supabase", { enabledRegions: ["right", "footer"] });

    const config = await readProjectSetupConfig();

    expect(config).toMatchObject({
      authMode: "supabase",
      authProvider: "supabase",
      dbMode: "supabase",
      gnbLayout: { enabledRegions: ["right", "footer"] },
      menuSourceMode: "manual",
    });
  });
});
