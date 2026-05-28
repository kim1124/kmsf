import { describe, expect, it } from "vitest";

import { resolveSupabaseAuthorization } from "./authorization";

describe("resolveSupabaseAuthorization", () => {
  it("does not trust user metadata for role or level fallback", () => {
    expect(
      resolveSupabaseAuthorization({
        appMetadata: {},
        manager: null,
      }),
    ).toEqual({
      level: 1,
      role: "member",
      status: "active",
    });
  });

  it("uses app metadata as the only Supabase auth metadata authorization fallback", () => {
    expect(
      resolveSupabaseAuthorization({
        appMetadata: {
          level: 3,
          role: "admin",
        },
        manager: null,
      }),
    ).toEqual({
      level: 3,
      role: "admin",
      status: "active",
    });
  });

  it("prefers manager authorization over app metadata", () => {
    expect(
      resolveSupabaseAuthorization({
        appMetadata: {
          level: 3,
          role: "admin",
        },
        manager: {
          level: 1,
          role: "member",
          status: "suspended",
        },
      }),
    ).toEqual({
      level: 1,
      role: "member",
      status: "suspended",
    });
  });
});
