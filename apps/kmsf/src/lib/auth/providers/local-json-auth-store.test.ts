import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createLocalJsonAccount,
  deleteLocalJsonAccount,
  findLocalJsonAccountById,
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
