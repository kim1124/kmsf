import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createLocalJsonAccount,
  deleteLocalJsonAccount,
  findLocalJsonAccountById,
  hasLocalJsonAccounts,
  listLocalJsonAccounts,
  resetLocalJsonAuthStore,
  updateLocalJsonAccount,
  verifyLocalJsonAccountPassword,
  verifyLocalJsonCredentials,
} from "./local-json-auth-store";

let tempDir: string;
let dbPath: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "kmsf-local-auth-"));
  dbPath = join(tempDir, "auth.db.json");
  process.env.KMSF_LOCAL_AUTH_DB_PATH = dbPath;
});

afterEach(async () => {
  delete process.env.KMSF_LOCAL_AUTH_DB_PATH;
  await rm(tempDir, { recursive: true, force: true });
});

describe("local-json auth store", () => {
  it("uses lowdb as the local file database adapter", async () => {
    const source = await readFile("src/lib/auth/providers/local-json-auth-store.ts", "utf8");

    expect(source).toContain("lowdb/node");
    expect(source).toContain("JSONFile");
  });

  it("reports whether any local account exists", async () => {
    await expect(hasLocalJsonAccounts()).resolves.toBe(false);

    await createLocalJsonAccount({
      username: "admin01",
      email: "admin01@local.test",
      password: "Admin01!",
      role: "admin",
    });

    await expect(hasLocalJsonAccounts()).resolves.toBe(true);
  });

  it("creates an account with a hashed password", async () => {
    const account = await createLocalJsonAccount({
      username: "member01",
      email: "member01@local.test",
      password: "Member01!",
      role: "member",
    });

    expect(account).toMatchObject({
      username: "member01",
      email: "member01@local.test",
      role: "member",
      authMode: "local-json",
    });

    const raw = await readFile(dbPath, "utf8");
    expect(raw).not.toContain("Member01!");
    expect(raw).toContain("passwordHash");
    expect(raw).toContain("passwordSalt");
  });

  it("rejects duplicate usernames and emails", async () => {
    await createLocalJsonAccount({
      username: "member01",
      email: "member01@local.test",
      password: "Member01!",
      role: "member",
    });

    await expect(
      createLocalJsonAccount({
        username: "member01",
        email: "other@local.test",
        password: "Member02!",
        role: "member",
      }),
    ).rejects.toMatchObject({ code: "duplicate_username" });

    await expect(
      createLocalJsonAccount({
        username: "member02",
        email: "member01@local.test",
        password: "Member02!",
        role: "member",
      }),
    ).rejects.toMatchObject({ code: "duplicate_email" });
  });

  it("supports local-json account lists within the focused test data cap", async () => {
    for (let index = 0; index < 10; index += 1) {
      await createLocalJsonAccount({
        username: `member${String(index).padStart(3, "0")}`,
        email: `member${String(index).padStart(3, "0")}@local.test`,
        password: "Member01!",
        role: index === 0 ? "admin" : "member",
      });
    }

    await expect(listLocalJsonAccounts()).resolves.toHaveLength(10);
  });

  it("verifies username or email credentials", async () => {
    const account = await createLocalJsonAccount({
      username: "member01",
      email: "member01@local.test",
      password: "Member01!",
      role: "member",
    });

    await expect(verifyLocalJsonCredentials("member01", "Member01!")).resolves.toEqual(account);
    await expect(verifyLocalJsonCredentials("member01@local.test", "Member01!")).resolves.toEqual(account);
    await expect(verifyLocalJsonCredentials("member01", "Wrong01!")).resolves.toBeNull();
  });

  it("lists account directory metadata and records the last successful sign-in time", async () => {
    await createLocalJsonAccount({
      displayName: "관리자",
      username: "admin01",
      email: "admin01@local.test",
      password: "Admin01!",
      role: "admin",
    });

    await expect(listLocalJsonAccounts()).resolves.toMatchObject([
      {
        displayName: "관리자",
        email: "admin01@local.test",
        lastSignedInAt: null,
        level: 3,
        role: "admin",
        username: "admin01",
      },
    ]);

    await verifyLocalJsonCredentials("admin01", "Admin01!");
    const accounts = await listLocalJsonAccounts();

    expect(accounts[0].lastSignedInAt).toEqual(expect.any(String));
  });

  it("verifies a local-json account password by id without touching last sign-in time", async () => {
    const account = await createLocalJsonAccount({
      username: "admin01",
      email: "admin01@local.test",
      password: "Admin01!",
      role: "admin",
    });

    await expect(verifyLocalJsonAccountPassword(account.id, "Admin01!")).resolves.toBe(true);
    await expect(verifyLocalJsonAccountPassword(account.id, "Wrong01!")).resolves.toBe(false);

    const [stored] = await listLocalJsonAccounts();
    expect(stored.lastSignedInAt).toBeNull();
  });

  it("resets all local-json accounts", async () => {
    await createLocalJsonAccount({
      username: "admin01",
      email: "admin01@local.test",
      password: "Admin01!",
      role: "admin",
    });

    await resetLocalJsonAuthStore();

    await expect(hasLocalJsonAccounts()).resolves.toBe(false);
    await expect(listLocalJsonAccounts()).resolves.toEqual([]);
  });

  it("updates account profile data without changing the password hash when no password is provided", async () => {
    const account = await createLocalJsonAccount({
      username: "member01",
      email: "member01@local.test",
      password: "Member01!",
      role: "member",
    });
    const before = await readFile(dbPath, "utf8");

    const updated = await updateLocalJsonAccount(account.id, {
      username: "member02",
      email: "member02@local.test",
    });
    const after = await readFile(dbPath, "utf8");

    expect(updated).toMatchObject({
      id: account.id,
      username: "member02",
      email: "member02@local.test",
    });
    expect(after).toContain("member02@local.test");
    expect(JSON.parse(after).accounts[0].passwordHash).toBe(JSON.parse(before).accounts[0].passwordHash);
    await expect(verifyLocalJsonCredentials("member02", "Member01!")).resolves.toEqual(updated);
  });

  it("overwrites the stored password hash when a new password is provided", async () => {
    const account = await createLocalJsonAccount({
      username: "member01",
      email: "member01@local.test",
      password: "Member01!",
      role: "member",
    });
    const before = JSON.parse(await readFile(dbPath, "utf8"));

    await updateLocalJsonAccount(account.id, {
      password: "Member02!",
    });
    const raw = await readFile(dbPath, "utf8");
    const after = JSON.parse(raw);

    expect(raw).not.toContain("Member01!");
    expect(raw).not.toContain("Member02!");
    expect(after.accounts[0].passwordHash).not.toBe(before.accounts[0].passwordHash);
    await expect(verifyLocalJsonCredentials("member01", "Member01!")).resolves.toBeNull();
    await expect(verifyLocalJsonCredentials("member01", "Member02!")).resolves.toMatchObject({
      id: account.id,
      username: "member01",
    });
  });

  it("preserves concurrent account creations", async () => {
    const inputs = Array.from({ length: 5 }, (_, index) => ({
      username: `member0${index}`,
      email: `member0${index}@local.test`,
      password: "Member01!",
      role: "member" as const,
    }));

    await Promise.all(inputs.map((input) => createLocalJsonAccount(input)));

    for (const input of inputs) {
      await expect(verifyLocalJsonCredentials(input.username, input.password)).resolves.toMatchObject({
        username: input.username,
        email: input.email,
      });
    }
  });

  it("deletes accounts by id", async () => {
    const account = await createLocalJsonAccount({
      username: "member01",
      email: "member01@local.test",
      password: "Member01!",
      role: "member",
    });

    await expect(findLocalJsonAccountById(account.id)).resolves.toEqual(account);

    await deleteLocalJsonAccount(account.id);

    await expect(findLocalJsonAccountById(account.id)).resolves.toBeNull();
  });
});
