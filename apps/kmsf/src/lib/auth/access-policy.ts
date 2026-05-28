import type { AppSessionUser } from "@/lib/auth/session";

export type ProtectedRouteId =
  | "chart-sample"
  | "dashboard"
  | "data-table-sample"
  | "settings"
  | "settings.accounts"
  | "settings.reset"
  | "settings.system";

export type SettingsSection = "accounts" | "reset" | "system";

export function isLevel3Admin(user: AppSessionUser | null | undefined) {
  return user?.role === "admin" && user.level === 3;
}

export function canManageSystem(user: AppSessionUser | null | undefined) {
  return isLevel3Admin(user);
}

export function canManageAccounts(user: AppSessionUser | null | undefined) {
  return isLevel3Admin(user);
}

export function canAccessSettingsSection(
  user: AppSessionUser | null | undefined,
  section: SettingsSection,
) {
  if (section === "accounts") {
    return canManageAccounts(user);
  }

  if (section === "reset") {
    return canManageSystem(user);
  }

  return Boolean(user);
}

export function canAccessRoute(
  user: AppSessionUser | null | undefined,
  routeId: ProtectedRouteId,
) {
  if (!user) {
    return false;
  }

  if (routeId === "settings.accounts") {
    return canManageAccounts(user);
  }

  if (routeId === "settings.reset") {
    return canManageSystem(user);
  }

  return true;
}

export function resolveSettingsSection(
  user: AppSessionUser | null | undefined,
  section: string | undefined,
): SettingsSection {
  const requested = section === "accounts" || section === "reset" ? section : "system";

  return canAccessSettingsSection(user, requested) ? requested : "system";
}
