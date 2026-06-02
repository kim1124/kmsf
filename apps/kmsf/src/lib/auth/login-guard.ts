import { createHash } from "node:crypto";

export const LOGIN_FAILURE_LIMIT = 3;
export const LOGIN_LOCK_SECONDS = 300;

export type LoginGuardProvider = "local-json" | "supabase";
export type LoginGuardEventType = "failed" | "locked" | "blocked" | "success";

export type LoginGuardCheckResult =
  | { status: "allowed" }
  | { remainingSeconds: number; status: "locked" };

export type LoginGuardRecordResult = LoginGuardCheckResult & {
  failedCount: number;
};

export function normalizeLoginIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

export function buildAccountLoginGuardIdentifier(accountId: string) {
  return `account:${accountId}`;
}

export function buildUnknownLoginGuardIdentifier(identifier: string) {
  return `identifier:${normalizeLoginIdentifier(identifier)}`;
}

export function hashLoginIdentifier(provider: LoginGuardProvider, identifier: string) {
  return createHash("sha256")
    .update(`${provider}:${normalizeLoginIdentifier(identifier)}`)
    .digest("hex");
}

export function shouldLockLogin(failedCount: number) {
  return failedCount >= LOGIN_FAILURE_LIMIT;
}

export function getLoginLockRemainingSeconds(
  lockedUntil: string | null | undefined,
  now = new Date(),
) {
  if (!lockedUntil) {
    return 0;
  }

  const remainingMs = new Date(lockedUntil).getTime() - now.getTime();

  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function buildLoginLockedUntil(now = new Date()) {
  return new Date(now.getTime() + LOGIN_LOCK_SECONDS * 1000).toISOString();
}
