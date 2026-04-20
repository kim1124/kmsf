import { describe, expect, it } from "vitest";

import { accountSchema, signInSchema } from "./validation";

describe("accountSchema", () => {
  it("rejects usernames shorter than 6 characters", () => {
    const parsed = accountSchema.safeParse({
      username: "kim12",
      email: "kim@example.com",
      password: "Pass12!",
      passwordConfirm: "Pass12!",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts email-style usernames", () => {
    const parsed = accountSchema.safeParse({
      username: "sampleuser@example.com",
      email: "kim@example.com",
      password: "Pass12!",
      passwordConfirm: "Pass12!",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects usernames outside the allowed pattern", () => {
    const parsed = accountSchema.safeParse({
      username: "kim-1124",
      email: "kim@example.com",
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
      email: "kim@example.com",
      password: "Pass1234",
      passwordConfirm: "Pass1234",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects password confirmation mismatches", () => {
    const parsed = accountSchema.safeParse({
      username: "sampleuser",
      email: "kim@example.com",
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
});
