import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  SystemResetAuditEvent,
  SystemResetAuditEventInput,
} from "@/lib/auth/system-reset-audit";

const LOCAL_RESET_AUDIT_VERSION = 1;
let localResetAuditMutationQueue = Promise.resolve();

type LocalSystemResetAuditDb = {
  events: SystemResetAuditEvent[];
  version: typeof LOCAL_RESET_AUDIT_VERSION;
};

function getSystemResetLocalBaseDir() {
  return (
    process.env.KMSF_SYSTEM_RESET_BASE_DIR ??
    join(/*turbopackIgnore: true*/ process.cwd(), ".local")
  );
}

export function getLocalSystemResetAuditPath() {
  return join(getSystemResetLocalBaseDir(), "system-reset-audit.json");
}

function createEmptyAuditDb(): LocalSystemResetAuditDb {
  return {
    events: [],
    version: LOCAL_RESET_AUDIT_VERSION,
  };
}

function normalizeAuditDb(value: unknown): LocalSystemResetAuditDb {
  if (!value || typeof value !== "object") {
    return createEmptyAuditDb();
  }

  const candidate = value as Partial<LocalSystemResetAuditDb>;

  if (
    candidate.version !== LOCAL_RESET_AUDIT_VERSION ||
    !Array.isArray(candidate.events)
  ) {
    return createEmptyAuditDb();
  }

  return {
    events: candidate.events,
    version: LOCAL_RESET_AUDIT_VERSION,
  };
}

async function readAuditDb() {
  try {
    const raw = await readFile(getLocalSystemResetAuditPath(), "utf8");

    return normalizeAuditDb(JSON.parse(raw));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return createEmptyAuditDb();
    }

    throw error;
  }
}

async function writeAuditDb(db: LocalSystemResetAuditDb) {
  const path = getLocalSystemResetAuditPath();

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

async function withLocalResetAuditMutation<T>(operation: () => Promise<T>) {
  const run = localResetAuditMutationQueue.then(operation, operation);
  localResetAuditMutationQueue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

export async function appendLocalSystemResetAuditEvent(
  input: SystemResetAuditEventInput,
) {
  return withLocalResetAuditMutation(async () => {
    const db = await readAuditDb();
    const event: SystemResetAuditEvent = {
      ...input,
      createdAt: input.createdAt ?? new Date().toISOString(),
      id: input.id ?? `reset_audit_${randomUUID()}`,
    };

    db.events.push(event);
    await writeAuditDb(db);

    return event;
  });
}

export async function readLocalSystemResetAuditEvents() {
  const db = await readAuditDb();

  return db.events;
}
