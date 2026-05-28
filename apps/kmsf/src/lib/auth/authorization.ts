import { normalizeRole, type AppRole } from "@/lib/auth/roles";

export type SupabaseAuthorization = {
  level: number;
  role: AppRole;
  status: "active" | "suspended";
};

type SupabaseAuthorizationManager = {
  level?: number | null;
  role?: string | null;
  status?: string | null;
} | null;

function getMetadataText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getMetadataLevel(value: unknown, role: AppRole) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && /^[1-3]$/.test(value)) {
    return Number(value);
  }

  return role === "admin" ? 3 : 1;
}

function normalizeStatus(value: unknown): SupabaseAuthorization["status"] {
  return value === "suspended" ? "suspended" : "active";
}

function normalizeOptionalRole(value: unknown) {
  const text = getMetadataText(value);

  return text ? normalizeRole(text) : null;
}

export function resolveSupabaseAuthorization({
  appMetadata,
  manager,
}: {
  appMetadata?: Record<string, unknown> | null;
  manager: SupabaseAuthorizationManager;
}): SupabaseAuthorization {
  const managerRole = normalizeOptionalRole(manager?.role);
  const appRole = normalizeOptionalRole(appMetadata?.role);
  const role = managerRole ?? appRole ?? "member";
  const level =
    typeof manager?.level === "number"
      ? manager.level
      : getMetadataLevel(appMetadata?.level, role);

  return {
    level,
    role,
    status: normalizeStatus(manager?.status),
  };
}
