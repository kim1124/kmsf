export const APP_ROLES = ["admin", "member"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function normalizeRole(input: string | null | undefined): AppRole {
  return input === "admin" ? "admin" : "member";
}
