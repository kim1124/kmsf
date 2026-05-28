import { describe, expect, it } from "vitest";

import {
  canAccessRoute,
  canManageAccounts,
  canManageSystem,
  resolveSettingsSection,
} from "./access-policy";
import type { AppSessionUser } from "./session";

function user(input: Partial<AppSessionUser>): AppSessionUser {
  return {
    authMode: "local-json",
    avatarDataUrl: null,
    avatarInitials: "KM",
    displayName: "KMSF User",
    email: "user@example.com",
    id: "user-1",
    isAuthenticated: true,
    level: 1,
    role: "member",
    username: "member01",
    ...input,
  };
}

describe("access policy", () => {
  it("limits system management and account management to level 3 admins", () => {
    const member = user({ level: 1, role: "member" });
    const levelTwoAdmin = user({ level: 2, role: "admin" });
    const levelThreeAdmin = user({ level: 3, role: "admin" });

    expect(canManageSystem(member)).toBe(false);
    expect(canManageSystem(levelTwoAdmin)).toBe(false);
    expect(canManageSystem(levelThreeAdmin)).toBe(true);
    expect(canManageAccounts(levelThreeAdmin)).toBe(true);
  });

  it("keeps current protected routes authenticated while reserving management routes", () => {
    const member = user({ level: 1, role: "member" });
    const admin = user({ level: 3, role: "admin" });

    expect(canAccessRoute(member, "dashboard")).toBe(true);
    expect(canAccessRoute(member, "settings.accounts")).toBe(false);
    expect(canAccessRoute(member, "settings.reset")).toBe(false);
    expect(canAccessRoute(admin, "settings.accounts")).toBe(true);
    expect(canAccessRoute(admin, "settings.reset")).toBe(true);
  });

  it("falls back to system settings when a user cannot access a requested section", () => {
    expect(resolveSettingsSection(user({ role: "member", level: 1 }), "reset")).toBe("system");
    expect(resolveSettingsSection(user({ role: "admin", level: 3 }), "reset")).toBe("reset");
  });
});
