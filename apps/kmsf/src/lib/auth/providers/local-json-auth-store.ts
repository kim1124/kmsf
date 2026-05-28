import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

import type { AppRole } from "@/lib/auth/roles";

const scrypt = promisify(scryptCallback);

const DB_VERSION = 1;
let dbMutationQueue = Promise.resolve();

export type LocalJsonAuthMode = "local-json";

export type LocalJsonAccount = {
  displayName: string;
  id: string;
  username: string;
  email: string;
  level: number;
  role: AppRole;
  authMode: LocalJsonAuthMode;
};

export type LocalJsonAccountDirectoryEntry = LocalJsonAccount & {
  createdAt: string;
  lastSignedInAt: string | null;
  updatedAt: string;
};

type StoredLocalJsonAccount = {
  displayName?: string;
  id: string;
  username: string;
  email: string;
  level?: number;
  role: AppRole;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  lastSignedInAt?: string | null;
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

function createEmptyDb(): LocalJsonAuthDb {
  return { version: DB_VERSION, accounts: [] };
}

async function openDb() {
  const adapter = new JSONFile<LocalJsonAuthDb>(getLocalJsonAuthDbPath());
  const db = new Low(adapter, createEmptyDb());

  await db.read();

  if (db.data.version !== DB_VERSION || !Array.isArray(db.data.accounts)) {
    db.data = createEmptyDb();
  }

  return db;
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function getDefaultLevel(role: AppRole) {
  return role === "admin" ? 3 : 1;
}

function toPublicAccount(account: StoredLocalJsonAccount): LocalJsonAccount {
  return {
    displayName: account.displayName ?? account.username,
    id: account.id,
    username: account.username,
    email: account.email,
    level: account.level ?? getDefaultLevel(account.role),
    role: account.role,
    authMode: "local-json",
  };
}

function toDirectoryEntry(account: StoredLocalJsonAccount): LocalJsonAccountDirectoryEntry {
  return {
    ...toPublicAccount(account),
    createdAt: account.createdAt,
    lastSignedInAt: account.lastSignedInAt ?? null,
    updatedAt: account.updatedAt,
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

async function readDbFile(): Promise<LocalJsonAuthDb> {
  const db = await openDb();

  return db.data;
}

async function readDb(): Promise<LocalJsonAuthDb> {
  await dbMutationQueue;

  return readDbFile();
}

async function writeDb(db: LocalJsonAuthDb) {
  const dbPath = getLocalJsonAuthDbPath();
  const lowdb = await openDb();

  await mkdir(dirname(dbPath), { recursive: true });
  lowdb.data = db;
  await lowdb.write();
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
  displayName?: string;
  username: string;
  email: string;
  level?: number;
  password: string;
  role: AppRole;
}) {
  return withDbMutation(async () => {
    const db = await readDbFile();
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
      displayName: input.displayName?.trim() || username,
      id: `local_${randomUUID()}`,
      username,
      email,
      level: input.level ?? getDefaultLevel(input.role),
      role: input.role,
      ...passwordFields,
      createdAt: timestamp,
      lastSignedInAt: null,
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

export async function updateLocalJsonAccount(
  id: string,
  input: {
    displayName?: string;
    username?: string;
    email?: string;
    password?: string;
  },
) {
  return withDbMutation(async () => {
    const db = await readDbFile();
    const account = db.accounts.find((candidate) => candidate.id === id);

    if (!account) {
      return null;
    }

    const username = input.username?.trim() || account.username;
    const email = input.email?.trim().toLowerCase() || account.email;
    const normalizedUsername = normalizeIdentifier(username);
    const normalizedEmail = normalizeIdentifier(email);

    if (
      db.accounts.some(
        (candidate) =>
          candidate.id !== id &&
          normalizeIdentifier(candidate.username) === normalizedUsername,
      )
    ) {
      throw new LocalJsonAuthStoreError("duplicate_username", "Local username already exists.");
    }

    if (
      db.accounts.some(
        (candidate) =>
          candidate.id !== id &&
          normalizeIdentifier(candidate.email) === normalizedEmail,
      )
    ) {
      throw new LocalJsonAuthStoreError("duplicate_email", "Local email already exists.");
    }

    const passwordFields = input.password ? await hashPassword(input.password) : null;

    Object.assign(account, {
      ...(input.displayName !== undefined
        ? { displayName: input.displayName.trim() || username }
        : null),
      ...(passwordFields ?? null),
      email,
      username,
      updatedAt: new Date().toISOString(),
    });

    await writeDb(db);

    return toPublicAccount(account);
  });
}

export async function hasLocalJsonAccounts() {
  const db = await readDb();

  return db.accounts.length > 0;
}

export async function listLocalJsonAccounts() {
  const db = await readDb();

  return db.accounts
    .map(toDirectoryEntry)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function verifyLocalJsonCredentials(identifier: string, password: string) {
  return withDbMutation(async () => {
    const db = await readDbFile();
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

    account.lastSignedInAt = new Date().toISOString();
    await writeDb(db);

    return toPublicAccount(account);
  });
}

export async function verifyLocalJsonAccountPassword(id: string, password: string) {
  const db = await readDb();
  const account = db.accounts.find((candidate) => candidate.id === id);

  return account ? verifyPassword(password, account) : false;
}

export async function resetLocalJsonAuthStore() {
  await withDbMutation(async () => {
    const db = await readDbFile();

    await writeDb({
      ...db,
      accounts: [],
    });
  });
}

export async function deleteLocalJsonAccount(id: string) {
  await withDbMutation(async () => {
    const db = await readDbFile();
    const nextAccounts = db.accounts.filter((account) => account.id !== id);

    if (nextAccounts.length !== db.accounts.length) {
      await writeDb({
        ...db,
        accounts: nextAccounts,
      });
    }
  });
}
