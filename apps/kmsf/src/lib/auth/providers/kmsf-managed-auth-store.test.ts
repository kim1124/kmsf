import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createKmsfManagedAccount,
  hasKmsfManagedAccounts,
  listKmsfManagedAccounts,
  resetKmsfManagedAuthStore,
  verifyKmsfManagedCredentials,
} from "./kmsf-managed-auth-store";

let tempDir: string;
const originalCwd = process.cwd();
const originalSetupConfigFile = process.env.KMSF_SETUP_CONFIG_FILE;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "kmsf-managed-auth-"));
  process.chdir(tempDir);
  process.env.KMSF_SETUP_CONFIG_FILE = "setup.test.json";
  process.env.KMSF_LOCAL_AUTH_DB_PATH = join(tempDir, "auth.db.json");
  process.env.KMSF_SQLITE_AUTH_DB_PATH = join(tempDir, "auth.sqlite");
});

afterEach(async () => {
  process.chdir(originalCwd);
  delete process.env.KMSF_LOCAL_AUTH_DB_PATH;
  delete process.env.KMSF_SQLITE_AUTH_DB_PATH;
  if (originalSetupConfigFile === undefined) {
    delete process.env.KMSF_SETUP_CONFIG_FILE;
  } else {
    process.env.KMSF_SETUP_CONFIG_FILE = originalSetupConfigFile;
  }
  await rm(tempDir, { recursive: true, force: true });
});

describe("kmsf managed auth store", () => {
  it("uses sqlite when the stored setup dbMode is sqlite", async () => {
    const { writeProjectSetupConfig } = await import("@/lib/setup/project-setup-config");

    await writeProjectSetupConfig({
      appConfigStorageMode: "connected-db",
      authMode: "kmsf-managed",
      dbMode: "sqlite",
      menuSourceMode: "manual",
    });

    const account = await createKmsfManagedAccount({
      username: "admin",
      email: "admin@example.com",
      password: "Admin01!",
      role: "admin",
    });

    await expect(verifyKmsfManagedCredentials("admin", "Admin01!")).resolves.toEqual(account);
    await expect(listKmsfManagedAccounts()).resolves.toMatchObject([
      {
        email: "admin@example.com",
        username: "admin",
      },
    ]);
    await expect(hasKmsfManagedAccounts()).resolves.toBe(true);

    await resetKmsfManagedAuthStore();

    await expect(hasKmsfManagedAccounts()).resolves.toBe(false);
  });
});
