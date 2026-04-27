import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

import type { AppRole } from "@/lib/auth/roles";

const scrypt = promisify(scryptCallback);

const DB_VERSION = 1;
let dbMutationQueue = Promise.resolve();

export type LocalJsonAuthMode = "local-json";

export type LocalJsonAccount = {
  id: string;
  username: string;
  email: string;
  role: AppRole;
  authMode: LocalJsonAuthMode;
};

type StoredLocalJsonAccount = {
  id: string;
  username: string;
  email: string;
  role: AppRole;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
};

type LocalJsonAuthDb = {
  version: number;
  accounts: StoredLocalJsonAccount[];
};

export class LocalJsonAuthStoreError extends Error {
  constructor(
    public readonly code: "duplicate_username" | "duplicate_email",
    message: string,
  ) {
    super(message);
    this.name = "LocalJsonAuthStoreError";
  }
}

function getLocalJsonAuthDbPath() {
  return (
    process.env.KMSF_LOCAL_AUTH_DB_PATH ??
    join(/*turbopackIgnore: true*/ process.cwd(), ".local", "auth.db.json")
  );
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function toPublicAccount(account: StoredLocalJsonAccount): LocalJsonAccount {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    role: account.role,
    authMode: "local-json",
  };
}

async function hashPassword(password: string, salt = randomBytes(16).toString("base64")) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;

  return {
    passwordHash: derived.toString("base64"),
    passwordSalt: salt,
  };
}

async function verifyPassword(password: string, stored: StoredLocalJsonAccount) {
  const { passwordHash } = await hashPassword(password, stored.passwordSalt);
  const expected = Buffer.from(stored.passwordHash, "base64");
  const actual = Buffer.from(passwordHash, "base64");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function readDb(): Promise<LocalJsonAuthDb> {
  const dbPath = getLocalJsonAuthDbPath();

  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalJsonAuthDb>;

    if (parsed.version !== DB_VERSION || !Array.isArray(parsed.accounts)) {
      return { version: DB_VERSION, accounts: [] };
    }

    return {
      version: DB_VERSION,
      accounts: parsed.accounts,
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { version: DB_VERSION, accounts: [] };
    }

    throw error;
  }
}

async function writeDb(db: LocalJsonAuthDb) {
  const dbPath = getLocalJsonAuthDbPath();
  const tempPath = `${dbPath}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(dirname(dbPath), { recursive: true });
  await writeFile(tempPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  await rename(tempPath, dbPath);
}

async function withDbMutation<T>(operation: () => Promise<T>) {
  const run = dbMutationQueue.then(operation, operation);
  dbMutationQueue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

export async function createLocalJsonAccount(input: {
  username: string;
  email: string;
  password: string;
  role: AppRole;
}) {
  return withDbMutation(async () => {
    const db = await readDb();
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    const normalizedUsername = normalizeIdentifier(username);
    const normalizedEmail = normalizeIdentifier(email);

    if (db.accounts.some((account) => normalizeIdentifier(account.username) === normalizedUsername)) {
      throw new LocalJsonAuthStoreError("duplicate_username", "Local username already exists.");
    }

    if (db.accounts.some((account) => normalizeIdentifier(account.email) === normalizedEmail)) {
      throw new LocalJsonAuthStoreError("duplicate_email", "Local email already exists.");
    }

    const timestamp = new Date().toISOString();
    const passwordFields = await hashPassword(input.password);
    const account: StoredLocalJsonAccount = {
      id: `local_${randomUUID()}`,
      username,
      email,
      role: input.role,
      ...passwordFields,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    db.accounts.push(account);
    await writeDb(db);

    return toPublicAccount(account);
  });
}

export async function findLocalJsonAccountById(id: string) {
  const db = await readDb();
  const account = db.accounts.find((candidate) => candidate.id === id);

  return account ? toPublicAccount(account) : null;
}

export async function verifyLocalJsonCredentials(identifier: string, password: string) {
  const db = await readDb();
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const account = db.accounts.find((candidate) => {
    return (
      normalizeIdentifier(candidate.username) === normalizedIdentifier ||
      normalizeIdentifier(candidate.email) === normalizedIdentifier
    );
  });

  if (!account || !(await verifyPassword(password, account))) {
    return null;
  }

  return toPublicAccount(account);
}

export async function deleteLocalJsonAccount(id: string) {
  await withDbMutation(async () => {
    const db = await readDb();
    const nextAccounts = db.accounts.filter((account) => account.id !== id);

    if (nextAccounts.length !== db.accounts.length) {
      await writeDb({
        ...db,
        accounts: nextAccounts,
      });
    }
  });
}
