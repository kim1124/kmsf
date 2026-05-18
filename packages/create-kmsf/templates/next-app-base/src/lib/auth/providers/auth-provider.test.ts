import { describe, expect, it } from "vitest";

import { getAuthProviderKind, isLocalJsonAuthEnabled } from "./auth-provider";

describe("auth provider selection", () => {
  it("uses supabase by default", () => {
    const env = {};

    expect(getAuthProviderKind(env)).toBe("supabase");
    expect(isLocalJsonAuthEnabled(env)).toBe(false);
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
