import { describe, expect, it } from "vitest";

import {
  APP_SESSION_IDLE_TIMEOUT_MS,
  createAppSessionCookieValue,
  formatAppSessionRedirectHref,
  isAppSessionExpired,
  parseAppSessionCookieValue,
} from "./app-session";

describe("app session cookie", () => {
  it("parses a serialized cookie value", () => {
    const value = createAppSessionCookieValue({
      runtimeId: "runtime-a",
      issuedAt: 1_000,
      lastActivityAt: 2_000,
    });

    expect(parseAppSessionCookieValue(value)).toEqual({
      runtimeId: "runtime-a",
      issuedAt: 1_000,
      lastActivityAt: 2_000,
    });
  });

  it("expires when the runtime id changes in development", () => {
    const value = createAppSessionCookieValue({
      runtimeId: "runtime-a",
      issuedAt: 1_000,
      lastActivityAt: 2_000,
    });

    expect(
      isAppSessionExpired(value, {
        now: 2_500,
        runtimeId: "runtime-b",
        enforceRuntimeId: true,
      }),
    ).toBe(true);
  });

  it("expires after one hour without activity", () => {
    const value = createAppSessionCookieValue({
      runtimeId: "runtime-a",
      issuedAt: 1_000,
      lastActivityAt: 2_000,
    });

    expect(
      isAppSessionExpired(value, {
        now: 2_000 + APP_SESSION_IDLE_TIMEOUT_MS + 1,
        runtimeId: "runtime-a",
        enforceRuntimeId: true,
      }),
    ).toBe(true);
  });

  it("builds a sign-in redirect with the expiry reason", () => {
    expect(formatAppSessionRedirectHref("session-expired")).toBe(
      "/sign-in?success=session-expired",
    );
  });
});
