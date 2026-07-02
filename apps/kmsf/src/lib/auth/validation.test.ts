import { describe, expect, it } from "vitest";

import {
  accountSchema,
  getLiveAccountFieldErrors,
  getLiveProfileFieldErrors,
  getLiveSignInFieldErrors,
  signInSchema,
  sanitizeVisibleInput,
} from "./validation";

describe("accountSchema", () => {
  it("rejects usernames shorter than 5 characters", () => {
    const parsed = accountSchema.safeParse({
      username: "kim1",
      email: "kim@example.com",
      password: "Pass12!",
      passwordConfirm: "Pass12!",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts 5 character usernames", () => {
    const parsed = accountSchema.safeParse({
      username: "kim12",
      email: "kim@example.com",
      password: "Pass12!",
      passwordConfirm: "Pass12!",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts email-style usernames", () => {
    const parsed = accountSchema.safeParse({
      username: "sampleuser@example.com",
      email: "admin@example.com",
      password: "Pass12!",
      passwordConfirm: "Pass12!",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts the reserved initial admin username", () => {
    const parsed = accountSchema.safeParse({
      username: "admin",
      email: "admin@example.com",
      password: "Pass12!",
      passwordConfirm: "Pass12!",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts the agreed initial admin test password", () => {
    const parsed = accountSchema.safeParse({
      username: "admin",
      email: "admin@example.com",
      password: "admin!@#$",
      passwordConfirm: "admin!@#$",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects usernames outside the allowed pattern", () => {
    const parsed = accountSchema.safeParse({
      username: "sample-user",
      email: "admin@example.com",
      password: "Pass12!",
      passwordConfirm: "Pass12!",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    const parsed = accountSchema.safeParse({
      username: "sampleuser",
      email: "kim",
      password: "Pass12!",
      passwordConfirm: "Pass12!",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects passwords without a special character", () => {
    const parsed = accountSchema.safeParse({
      username: "sampleuser",
      email: "admin@example.com",
      password: "Pass1234",
      passwordConfirm: "Pass1234",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects password confirmation mismatches", () => {
    const parsed = accountSchema.safeParse({
      username: "sampleuser",
      email: "admin@example.com",
      password: "Pass12!",
      passwordConfirm: "Pass13!",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts login fields that match the shared rules", () => {
    const parsed = signInSchema.safeParse({
      locale: "ko",
      username: "sampleuser",
      password: "Pass12!",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts the reserved initial admin username", () => {
    const parsed = signInSchema.safeParse({
      locale: "ko",
      username: "admin",
      password: "Pass12!",
    });

    expect(parsed.success).toBe(true);
  });
});

describe("sanitizeVisibleInput", () => {
  it("removes executable markup while preserving visible text", () => {
    expect(sanitizeVisibleInput("<img src=x onerror=alert(1)>sampleuser")).toBe("sampleuser");
  });
});

describe("live client validation", () => {
  it("returns sign-in errors while typing invalid values", () => {
    expect(
      getLiveSignInFieldErrors({
        username: "kim",
        password: "1234",
      }),
    ).toEqual({
      username: "username.invalid",
      password: "password.invalid",
    });
  });

  it("returns account errors while typing invalid values", () => {
    expect(
      getLiveAccountFieldErrors({
        username: "kim",
        email: "broken",
        password: "1234",
        passwordConfirm: "4321",
      }),
    ).toEqual({
      username: "username.invalid",
      email: "email.invalid",
      password: "password.invalid",
      passwordConfirm: "passwordConfirm.invalid",
    });
  });

  it("returns profile errors only for the touched invalid fields", () => {
    expect(
      getLiveProfileFieldErrors({
        username: "kim",
        email: "broken",
        password: "short",
        passwordConfirm: "different",
      }),
    ).toEqual({
      username: "username.invalid",
      email: "email.invalid",
      password: "password.invalid",
      passwordConfirm: "passwordConfirm.mismatch",
    });
  });
});
