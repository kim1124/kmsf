import { describe, expect, it } from "vitest";

import {
  LOGIN_FAILURE_LIMIT,
  LOGIN_LOCK_SECONDS,
  getLoginLockRemainingSeconds,
  hashLoginIdentifier,
  shouldLockLogin,
} from "./login-guard";

describe("login guard", () => {
  it("uses a 3 failure limit and a 300 second lock window", () => {
    expect(LOGIN_FAILURE_LIMIT).toBe(3);
    expect(LOGIN_LOCK_SECONDS).toBe(300);
    expect(shouldLockLogin(2)).toBe(false);
    expect(shouldLockLogin(3)).toBe(true);
  });

  it("calculates remaining lock seconds without returning negative values", () => {
    const now = new Date("2026-05-29T00:00:00.000Z");

    expect(getLoginLockRemainingSeconds("2026-05-29T00:05:00.000Z", now)).toBe(300);
    expect(getLoginLockRemainingSeconds("2026-05-29T00:00:00.001Z", now)).toBe(1);
    expect(getLoginLockRemainingSeconds("2026-05-28T23:59:59.000Z", now)).toBe(0);
    expect(getLoginLockRemainingSeconds(null, now)).toBe(0);
  });

  it("hashes normalized identifiers without exposing the raw value", () => {
    const left = hashLoginIdentifier("local-json", " MEMBER01 ");
    const right = hashLoginIdentifier("local-json", "member01");

    expect(left).toBe(right);
    expect(left).toHaveLength(64);
    expect(left).not.toContain("member01");
  });
});
