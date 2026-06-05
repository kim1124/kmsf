import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type {
  SystemResetActor,
  SystemResetBackupRecord,
} from "@/lib/auth/system-reset-audit";
import type { AuthProviderKind } from "@/lib/auth/providers/auth-provider";
import type { SystemResetMode } from "@/lib/auth/system-reset";

function getSystemResetLocalBaseDir() {
  return (
    process.env.KMSF_SYSTEM_RESET_BASE_DIR ??
    join(/*turbopackIgnore: true*/ process.cwd(), ".local")
  );
}

function formatCompactTimestamp(date: Date) {
  const compact = date.toISOString().replace(/\D/g, "");

  return `${compact.slice(0, 8)}-${compact.slice(8, 14)}`;
}

export function getLocalSystemResetBackupDir() {
  return join(getSystemResetLocalBaseDir(), "system-reset-backups");
}

export async function createLocalSystemResetBackup(input: {
  actor: SystemResetActor;
  mode: SystemResetMode;
  provider: AuthProviderKind;
  snapshot: unknown;
}) {
  const now = new Date();
  const id = `reset_backup_${randomUUID()}`;
  const backup: SystemResetBackupRecord = {
    actor: input.actor,
    createdAt: now.toISOString(),
    id,
    mode: input.mode,
    provider: input.provider,
    snapshot: input.snapshot,
    version: 1,
  };
  const backupDir = getLocalSystemResetBackupDir();
  const fileName = [
    formatCompactTimestamp(now),
    input.mode,
    input.provider,
    `${id.slice(-12)}.json`,
  ].join("-");
  const path = join(backupDir, fileName);

  await mkdir(backupDir, { recursive: true });
  await writeFile(path, `${JSON.stringify(backup, null, 2)}\n`, "utf8");

  return {
    path,
    record: backup,
    ref: `file:${path}`,
  };
}
