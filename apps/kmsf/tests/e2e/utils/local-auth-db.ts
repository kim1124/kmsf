import { rm } from "node:fs/promises";
import { join } from "node:path";

export async function cleanupCodexLocalAuthDb() {
  const dbPath = process.env.KMSF_LOCAL_AUTH_DB_PATH;

  if (!dbPath?.startsWith("/private/tmp/kmsf-")) {
    return;
  }

  await rm(dbPath, { force: true });
}

export async function cleanupCodexSetupConfig() {
  const configFile = process.env.KMSF_SETUP_CONFIG_FILE;

  if (!configFile?.startsWith("setup.codex-")) {
    return;
  }

  await rm(join(process.cwd(), ".local", configFile), { force: true });
}
