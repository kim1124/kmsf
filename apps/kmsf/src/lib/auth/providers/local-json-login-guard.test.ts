import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createLocalJsonAccount,
  getLocalJsonLoginAuditEvents,
  getLocalJsonLoginLock,
  recordLocalJsonLoginBlocked,
  recordLocalJsonLoginFailure,
  recordLocalJsonLoginSuccess,
} from "./local-json-auth-store";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "kmsf-local-auth-guard-"));
  process.env.KMSF_LOCAL_AUTH_DB_PATH = join(tempDir, "auth.db.json");
});

afterEach(async () => {
  delete process.env.KMSF_LOCAL_AUTH_DB_PATH;
  await rm(tempDir, { recursive: true, force: true });
});

describe("local-json login guard", () => {
  it("locks sign-in for 300 seconds after 3 failed attempts and records audit events", async () => {
    await createLocalJsonAccount({
      username: "member01",
      email: "member01@local.test",
      password: "Member01!",
      role: "member",
    });

    await expect(recordLocalJsonLoginFailure("member01")).resolves.toMatchObject({
      failedCount: 1,
      status: "allowed",
    });
    await expect(recordLocalJsonLoginFailure("member01")).resolves.toMatchObject({
      failedCount: 2,
      status: "allowed",
    });
    await expect(recordLocalJsonLoginFailure("member01")).resolves.toMatchObject({
      failedCount: 3,
      remainingSeconds: 300,
      status: "locked",
    });
    await expect(getLocalJsonLoginLock("member01")).resolves.toMatchObject({
      remainingSeconds: expect.any(Number),
      status: "locked",
    });

    await recordLocalJsonLoginBlocked("member01");
    const auditEvents = await getLocalJsonLoginAuditEvents();

    expect(auditEvents.map((event) => event.eventType)).toEqual([
      "failed",
      "failed",
      "locked",
      "blocked",
    ]);
    expect(JSON.stringify(auditEvents)).not.toContain("Member01!");
  });

  it("uses one account lock state for username and email sign-in attempts", async () => {
    await createLocalJsonAccount({
      username: "member01",
      email: "member01@local.test",
      password: "Member01!",
      role: "member",
    });

    await expect(recordLocalJsonLoginFailure("member01")).resolves.toMatchObject({
      failedCount: 1,
      status: "allowed",
    });
    await expect(recordLocalJsonLoginFailure("member01")).resolves.toMatchObject({
      failedCount: 2,
      status: "allowed",
    });
    await expect(recordLocalJsonLoginFailure("MEMBER01@LOCAL.TEST")).resolves.toMatchObject({
      failedCount: 3,
      status: "locked",
    });
    await expect(getLocalJsonLoginLock("member01@local.test")).resolves.toMatchObject({
      status: "locked",
    });
  });

  it("clears login lock state after a successful sign-in", async () => {
    const account = await createLocalJsonAccount({
      username: "member01",
      email: "member01@local.test",
      password: "Member01!",
      role: "member",
    });

    await recordLocalJsonLoginFailure("member01");
    await recordLocalJsonLoginFailure("member01");
    await recordLocalJsonLoginSuccess("member01", account.id);

    await expect(getLocalJsonLoginLock("member01")).resolves.toEqual({ status: "allowed" });
    const auditEvents = await getLocalJsonLoginAuditEvents();

    expect(auditEvents.at(-1)).toMatchObject({
      accountId: account.id,
      eventType: "success",
    });
  });
});
