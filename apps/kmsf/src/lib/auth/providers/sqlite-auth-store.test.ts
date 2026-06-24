import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createSqliteAccount,
  findSqliteAccountById,
  hasSqliteAccounts,
  listSqliteAccounts,
  resetSqliteAuthStore,
  verifySqliteAccountPassword,
  verifySqliteCredentials,
} from "./sqlite-auth-store";

let tempDir: string;
let dbPath: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "kmsf-sqlite-auth-"));
  dbPath = join(tempDir, "auth.sqlite");
  process.env.KMSF_SQLITE_AUTH_DB_PATH = dbPath;
});

afterEach(async () => {
  delete process.env.KMSF_SQLITE_AUTH_DB_PATH;
  await rm(tempDir, { recursive: true, force: true });
});

describe("sqlite auth store", () => {
  it("uses the async sqlite3 module as the local production-capable DB adapter", async () => {
    const source = await readFile("src/lib/auth/providers/sqlite-auth-store.ts", "utf8");

    expect(source).toContain("sqlite3");
  });

  it("creates and verifies accounts without storing plaintext passwords", async () => {
    await expect(hasSqliteAccounts()).resolves.toBe(false);

    const account = await createSqliteAccount({
      displayName: "관리자",
      username: "admin",
      email: "admin@example.com",
      password: "Admin01!",
      role: "admin",
    });

    expect(account).toMatchObject({
      authMode: "local-json",
      displayName: "관리자",
      email: "admin@example.com",
      level: 3,
      role: "admin",
      username: "admin",
    });
    await expect(hasSqliteAccounts()).resolves.toBe(true);
    await expect(findSqliteAccountById(account.id)).resolves.toEqual(account);
    await expect(verifySqliteCredentials("admin", "Admin01!")).resolves.toEqual(account);
    await expect(verifySqliteCredentials("admin@example.com", "Admin01!")).resolves.toEqual(account);
    await expect(verifySqliteCredentials("admin", "Wrong01!")).resolves.toBeNull();
    await expect(verifySqliteAccountPassword(account.id, "Admin01!")).resolves.toBe(true);

    const raw = await readFile(dbPath, "utf8");
    expect(raw).not.toContain("Admin01!");
  });

  it("lists accounts with directory metadata and supports reset", async () => {
    await createSqliteAccount({
      username: "member01",
      email: "member01@example.com",
      password: "Member01!",
      role: "member",
    });

    await expect(listSqliteAccounts()).resolves.toMatchObject([
      {
        email: "member01@example.com",
        lastSignedInAt: null,
        level: 1,
        role: "member",
        username: "member01",
      },
    ]);

    await resetSqliteAuthStore();

    await expect(listSqliteAccounts()).resolves.toEqual([]);
    await expect(hasSqliteAccounts()).resolves.toBe(false);
  });
});
