import { describe, expect, it } from "vitest";

import { getAuthProviderKind, isLocalJsonAuthEnabled } from "./auth-provider";

describe("auth provider selection", () => {
  it("uses supabase by default when Supabase credentials exist", () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    };

    expect(getAuthProviderKind(env)).toBe("supabase");
    expect(isLocalJsonAuthEnabled(env)).toBe(false);
  });

  it("falls back to local-json when Supabase credentials are missing", () => {
    const env = {};

    expect(getAuthProviderKind(env)).toBe("local-json");
    expect(isLocalJsonAuthEnabled(env)).toBe(true);
  });

  it("enables local-json when explicitly selected", () => {
    expect(
      getAuthProviderKind({
        NODE_ENV: "test",
        KMSF_AUTH_PROVIDER: "local-json",
      }),
    ).toBe("local-json");

    expect(
      getAuthProviderKind({
        NODE_ENV: "production",
        KMSF_AUTH_PROVIDER: "local-json",
      }),
    ).toBe("local-json");
  });
});
