import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  appendLocalSystemResetAuditEvent,
  readLocalSystemResetAuditEvents,
} from "./system-reset-audit.local-json.server";
import { createLocalSystemResetBackup } from "./system-reset-backup.server";

describe("local system reset artifacts", () => {
  let tempRoot: string;
  let originalBaseDir: string | undefined;

  beforeEach(async () => {
    originalBaseDir = process.env.KMSF_SYSTEM_RESET_BASE_DIR;
    tempRoot = await mkdtemp(join(tmpdir(), "kmsf-reset-artifacts-"));
    process.env.KMSF_SYSTEM_RESET_BASE_DIR = join(tempRoot, ".local");
  });

  afterEach(async () => {
    if (originalBaseDir === undefined) {
      delete process.env.KMSF_SYSTEM_RESET_BASE_DIR;
    } else {
      process.env.KMSF_SYSTEM_RESET_BASE_DIR = originalBaseDir;
    }

    await rm(tempRoot, { force: true, recursive: true });
  });

  it("writes local reset backup files outside the auth db", async () => {
    const backup = await createLocalSystemResetBackup({
      actor: {
        email: "admin@test.local",
        id: "local_admin",
        username: "admin",
      },
      mode: "factory",
      provider: "local-json",
      snapshot: {
        accounts: [{ username: "admin" }],
      },
    });

    expect(backup.path).toContain(".local/system-reset-backups/");
    expect(backup.ref).toBe(`file:${backup.path}`);
    expect(await readFile(backup.path, "utf8")).toContain("admin@test.local");
  });

  it("appends local reset audit events outside the auth db", async () => {
    await appendLocalSystemResetAuditEvent({
      actorEmail: "admin@test.local",
      actorId: "local_admin",
      actorUsername: "admin",
      backupRef: "file:/tmp/backup.json",
      errorMessage: null,
      mode: "factory",
      provider: "local-json",
      status: "success",
    });

    const events = await readLocalSystemResetAuditEvents();

    expect(events.at(-1)).toMatchObject({
      actorUsername: "admin",
      mode: "factory",
      status: "success",
    });
  });
});
