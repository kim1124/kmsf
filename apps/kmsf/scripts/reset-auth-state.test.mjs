import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const projectDir = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("reset-auth-state script", () => {
  it("removes the stored setup provider config during factory reset", async () => {
    const configFile = `setup.reset-auth-state-test-${process.pid}.json`;
    const configPath = join(projectDir, ".local", configFile);
    const dbPath = join("/private/tmp", `kmsf-reset-auth-state-${process.pid}.json`);

    await mkdir(dirname(configPath), { recursive: true });
    await writeFile(
      configPath,
      JSON.stringify({
        authProvider: "local-json",
        updatedAt: "2026-05-29T00:00:00.000Z",
        version: 1,
      }),
      "utf8",
    );
    await writeFile(dbPath, JSON.stringify({ accounts: [] }), "utf8");

    try {
      await execFileAsync("node", ["scripts/reset-auth-state.mjs"], {
        cwd: projectDir,
        env: {
          ...process.env,
          KMSF_ALLOW_DESTRUCTIVE_AUTH_RESET: "1",
          KMSF_LOCAL_AUTH_DB_PATH: dbPath,
          KMSF_SETUP_CONFIG_FILE: configFile,
          NEXT_PUBLIC_SUPABASE_URL: "",
          SUPABASE_API_KEY: "",
          SUPABASE_SECRET_KEY: "",
        },
      });

      expect(existsSync(configPath)).toBe(false);
      expect(existsSync(dbPath)).toBe(false);
    } finally {
      await rm(configPath, { force: true });
      await rm(dbPath, { force: true });
    }
  });
});
