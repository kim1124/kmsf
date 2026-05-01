import { describe, expect, it } from "vitest";

import {
  createLocalJsonSessionCookieValue,
  parseLocalJsonSessionCookieValue,
} from "./local-session.server";

describe("local-json session cookie", () => {
  it("parses a signed local-json session cookie", () => {
    const value = createLocalJsonSessionCookieValue({
      userId: "local_user",
      issuedAt: 1000,
    });

    expect(parseLocalJsonSessionCookieValue(value)).toEqual({
      userId: "local_user",
      issuedAt: 1000,
    });
  });

  it("rejects tampered values", () => {
    const value = createLocalJsonSessionCookieValue({
      userId: "local_user",
      issuedAt: 1000,
    });

    expect(parseLocalJsonSessionCookieValue(value.replace("local_user", "local_admin"))).toBeNull();
  });
});
