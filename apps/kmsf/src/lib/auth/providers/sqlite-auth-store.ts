import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

import sqlite3 from "sqlite3";

import type { AppRole } from "@/lib/auth/roles";

const scrypt = promisify(scryptCallback);
const SQLite3 = sqlite3.verbose();

export type SqliteAuthMode = "local-json";

export type SqliteAccount = {
  authMode: SqliteAuthMode;
  displayName: string;
  email: string;
  id: string;
  level: number;
  role: AppRole;
  username: string;
};

export type SqliteAccountDirectoryEntry = SqliteAccount & {
  createdAt: string;
  lastSignedInAt: string | null;
  updatedAt: string;
};

type StoredSqliteAccount = {
  created_at: string;
  display_name: string | null;
  email: string;
  id: string;
  last_signed_in_at: string | null;
  level: number;
  password_hash: string;
  password_salt: string;
  role: AppRole;
  updated_at: string;
  username: string;
};

export class SqliteAuthStoreError extends Error {
  constructor(
    public readonly code: "duplicate_username" | "duplicate_email",
    message: string,
  ) {
    super(message);
    this.name = "SqliteAuthStoreError";
  }
}

function getSqliteAuthDbPath() {
  return (
    process.env.KMSF_SQLITE_AUTH_DB_PATH ??
    join(/*turbopackIgnore: true*/ process.cwd(), ".local", "auth.sqlite")
  );
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function getDefaultLevel(role: AppRole) {
  return role === "admin" ? 3 : 1;
}

function toPublicAccount(account: StoredSqliteAccount): SqliteAccount {
  return {
    authMode: "local-json",
    displayName: account.display_name ?? account.username,
    email: account.email,
    id: account.id,
    level: account.level,
    role: account.role,
    username: account.username,
  };
}

function toDirectoryEntry(account: StoredSqliteAccount): SqliteAccountDirectoryEntry {
  return {
    ...toPublicAccount(account),
    createdAt: account.created_at,
    lastSignedInAt: account.last_signed_in_at,
    updatedAt: account.updated_at,
  };
}

async function hashPassword(password: string, salt = randomBytes(16).toString("base64")) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;

  return {
    passwordHash: derived.toString("base64"),
    passwordSalt: salt,
  };
}

async function verifyPassword(password: string, stored: StoredSqliteAccount) {
  const { passwordHash } = await hashPassword(password, stored.password_salt);
  const expected = Buffer.from(stored.password_hash, "base64");
  const actual = Buffer.from(passwordHash, "base64");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function openSqliteDb() {
  const dbPath = getSqliteAuthDbPath();
  await mkdir(dirname(dbPath), { recursive: true });

  return new Promise<sqlite3.Database>((resolve, reject) => {
    const db = new SQLite3.Database(dbPath, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(db);
    });
  });
}

function run(db: sqlite3.Database, sql: string, params: unknown[] = []) {
  return new Promise<void>((resolve, reject) => {
    db.run(sql, params, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function get<T>(db: sqlite3.Database, sql: string, params: unknown[] = []) {
  return new Promise<T | undefined>((resolve, reject) => {
    db.get(sql, params, (error, row: T | undefined) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all<T>(db: sqlite3.Database, sql: string, params: unknown[] = []) {
  return new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (error, rows: T[]) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function close(db: sqlite3.Database) {
  return new Promise<void>((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function initializeSqliteAuthDb(db: sqlite3.Database) {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      display_name TEXT,
      level INTEGER NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_signed_in_at TEXT,
      updated_at TEXT NOT NULL
    )`,
  );
}

async function withSqliteDb<T>(operation: (db: sqlite3.Database) => Promise<T>) {
  const db = await openSqliteDb();

  try {
    await initializeSqliteAuthDb(db);
    return await operation(db);
  } finally {
    await close(db);
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.toLowerCase().includes("unique constraint failed")
  );
}

async function findStoredSqliteAccountByIdentifier(
  db: sqlite3.Database,
  identifier: string,
) {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  return get<StoredSqliteAccount>(
    db,
    `SELECT * FROM accounts
      WHERE lower(username) = ? OR lower(email) = ?
      LIMIT 1`,
    [normalizedIdentifier, normalizedIdentifier],
  );
}

export async function createSqliteAccount(input: {
  displayName?: string;
  email: string;
  level?: number;
  password: string;
  role: AppRole;
  username: string;
}) {
  return withSqliteDb(async (db) => {
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    const timestamp = new Date().toISOString();
    const passwordFields = await hashPassword(input.password);
    const account: StoredSqliteAccount = {
      created_at: timestamp,
      display_name: input.displayName?.trim() || username,
      email,
      id: `sqlite_${randomUUID()}`,
      last_signed_in_at: null,
      level: input.level ?? getDefaultLevel(input.role),
      password_hash: passwordFields.passwordHash,
      password_salt: passwordFields.passwordSalt,
      role: input.role,
      updated_at: timestamp,
      username,
    };

    try {
      await run(
        db,
        `INSERT INTO accounts (
          id,
          username,
          email,
          display_name,
          level,
          role,
          password_hash,
          password_salt,
          created_at,
          last_signed_in_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          account.id,
          account.username,
          account.email,
          account.display_name,
          account.level,
          account.role,
          account.password_hash,
          account.password_salt,
          account.created_at,
          account.last_signed_in_at,
          account.updated_at,
        ],
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const duplicateUsername = await get<Pick<StoredSqliteAccount, "id">>(
          db,
          "SELECT id FROM accounts WHERE lower(username) = ? LIMIT 1",
          [normalizeIdentifier(username)],
        );

        throw new SqliteAuthStoreError(
          duplicateUsername ? "duplicate_username" : "duplicate_email",
          "SQLite account already exists.",
        );
      }

      throw error;
    }

    return toPublicAccount(account);
  });
}

export async function findSqliteAccountById(id: string) {
  return withSqliteDb(async (db) => {
    const account = await get<StoredSqliteAccount>(
      db,
      "SELECT * FROM accounts WHERE id = ? LIMIT 1",
      [id],
    );

    return account ? toPublicAccount(account) : null;
  });
}

export async function updateSqliteAccount(
  id: string,
  input: {
    displayName?: string;
    email?: string;
    password?: string;
    username?: string;
  },
) {
  return withSqliteDb(async (db) => {
    const account = await get<StoredSqliteAccount>(
      db,
      "SELECT * FROM accounts WHERE id = ? LIMIT 1",
      [id],
    );

    if (!account) {
      return null;
    }

    const username = input.username?.trim() || account.username;
    const email = input.email?.trim().toLowerCase() || account.email;
    const passwordFields = input.password ? await hashPassword(input.password) : null;
    const displayName =
      input.displayName !== undefined ? input.displayName.trim() || username : account.display_name;
    const timestamp = new Date().toISOString();

    try {
      await run(
        db,
        `UPDATE accounts
          SET username = ?,
            email = ?,
            display_name = ?,
            password_hash = ?,
            password_salt = ?,
            updated_at = ?
          WHERE id = ?`,
        [
          username,
          email,
          displayName,
          passwordFields?.passwordHash ?? account.password_hash,
          passwordFields?.passwordSalt ?? account.password_salt,
          timestamp,
          id,
        ],
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const duplicateUsername = await get<Pick<StoredSqliteAccount, "id">>(
          db,
          "SELECT id FROM accounts WHERE id <> ? AND lower(username) = ? LIMIT 1",
          [id, normalizeIdentifier(username)],
        );

        throw new SqliteAuthStoreError(
          duplicateUsername ? "duplicate_username" : "duplicate_email",
          "SQLite account already exists.",
        );
      }

      throw error;
    }

    const updated = await get<StoredSqliteAccount>(
      db,
      "SELECT * FROM accounts WHERE id = ? LIMIT 1",
      [id],
    );

    return updated ? toPublicAccount(updated) : null;
  });
}

export async function hasSqliteAccounts() {
  return withSqliteDb(async (db) => {
    const row = await get<{ count: number }>(db, "SELECT COUNT(*) as count FROM accounts");

    return (row?.count ?? 0) > 0;
  });
}

export async function listSqliteAccounts() {
  return withSqliteDb(async (db) => {
    const accounts = await all<StoredSqliteAccount>(
      db,
      "SELECT * FROM accounts ORDER BY created_at DESC",
    );

    return accounts.map(toDirectoryEntry);
  });
}

export async function readSqliteAuthStoreSnapshot() {
  return withSqliteDb(async (db) => {
    const accounts = await all<StoredSqliteAccount>(
      db,
      "SELECT * FROM accounts ORDER BY created_at DESC",
    );

    return {
      accounts,
      provider: "sqlite" as const,
      version: 1,
    };
  });
}

export async function verifySqliteCredentials(identifier: string, password: string) {
  return withSqliteDb(async (db) => {
    const account = await findStoredSqliteAccountByIdentifier(db, identifier);

    if (!account || !(await verifyPassword(password, account))) {
      return null;
    }

    const timestamp = new Date().toISOString();
    await run(db, "UPDATE accounts SET last_signed_in_at = ?, updated_at = ? WHERE id = ?", [
      timestamp,
      timestamp,
      account.id,
    ]);

    return toPublicAccount(account);
  });
}

export async function verifySqliteAccountPassword(id: string, password: string) {
  return withSqliteDb(async (db) => {
    const account = await get<StoredSqliteAccount>(
      db,
      "SELECT * FROM accounts WHERE id = ? LIMIT 1",
      [id],
    );

    return account ? verifyPassword(password, account) : false;
  });
}

export async function resetSqliteAuthStore() {
  await withSqliteDb(async (db) => {
    await run(db, "DELETE FROM accounts");
  });
}

export async function deleteSqliteAccount(id: string) {
  await withSqliteDb(async (db) => {
    await run(db, "DELETE FROM accounts WHERE id = ?", [id]);
  });
}
