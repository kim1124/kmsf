import { describe, expect, it } from "vitest";

import { resolveRootRoute } from "./root-routing";

describe("root route resolution", () => {
  it("renders the public welcome page after manual auth setup", () => {
    expect(
      resolveRootRoute({
        isAppSessionActive: false,
        setupConfig: {
          appConfigStorageMode: "local-storage",
          authMode: "manual",
          authProvider: "local-json",
          dbMode: "none",
          gnbLayout: { enabledRegions: [] },
          menuSourceMode: "manual",
          updatedAt: "2026-06-22T00:00:00.000Z",
          version: 2,
        },
        setupRequired: false,
        user: null,
      }),
    ).toEqual({ kind: "render-welcome" });
  });

  it("requires sign-in when kmsf-managed auth is configured and no user exists", () => {
    expect(
      resolveRootRoute({
        isAppSessionActive: false,
        setupConfig: {
          appConfigStorageMode: "connected-db",
          authMode: "kmsf-managed",
          authProvider: "local-json",
          dbMode: "dev-local-db",
          gnbLayout: { enabledRegions: ["top", "left"] },
          menuSourceMode: "manual",
          updatedAt: "2026-06-22T00:00:00.000Z",
          version: 2,
        },
        setupRequired: false,
        user: null,
      }),
    ).toEqual({ kind: "redirect", href: "/sign-in" });
  });

  it("keeps initial setup and expired-session redirects first", () => {
    expect(
      resolveRootRoute({
        isAppSessionActive: false,
        setupConfig: null,
        setupRequired: true,
        user: null,
      }),
    ).toEqual({ kind: "redirect", href: "/setup/initial-admin" });

    expect(
      resolveRootRoute({
        isAppSessionActive: false,
        setupConfig: null,
        setupRequired: false,
        user: {
          authMode: "local-json",
          avatarDataUrl: null,
          avatarInitials: "AD",
          displayName: "admin",
          email: "admin@example.com",
          id: "local-admin",
          isAuthenticated: true,
          level: 3,
          role: "admin",
          username: "admin",
        },
      }),
    ).toEqual({ kind: "redirect", href: "/auth/session-expired?reason=session-expired" });
  });
});
