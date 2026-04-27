export const APP_SESSION_COOKIE_NAME = "kmsf-app-session";
export const APP_SESSION_IDLE_TIMEOUT_MS = 60 * 60 * 1000;
export const APP_SESSION_HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

export type AppSessionCookie = {
  runtimeId: string;
  issuedAt: number;
  lastActivityAt: number;
};

type AppSessionExpiryOptions = {
  now?: number;
  runtimeId?: string;
  enforceRuntimeId?: boolean;
};

export function createAppSessionCookieValue(session: AppSessionCookie) {
  return [session.runtimeId, session.issuedAt, session.lastActivityAt].join(".");
}

export function parseAppSessionCookieValue(value: string | undefined | null): AppSessionCookie | null {
  if (!value) {
    return null;
  }

  const [runtimeId, issuedAtRaw, lastActivityAtRaw] = value.split(".");
  const issuedAt = Number(issuedAtRaw);
  const lastActivityAt = Number(lastActivityAtRaw);

  if (!runtimeId || !Number.isFinite(issuedAt) || !Number.isFinite(lastActivityAt)) {
    return null;
  }

  return {
    runtimeId,
    issuedAt,
    lastActivityAt,
  };
}

export function isAppSessionExpired(
  value: string | undefined | null,
  options: AppSessionExpiryOptions = {},
) {
  const parsed = parseAppSessionCookieValue(value);

  if (!parsed) {
    return true;
  }

  const now = options.now ?? Date.now();
  const runtimeId = options.runtimeId ?? "";
  const enforceRuntimeId = options.enforceRuntimeId ?? process.env.NODE_ENV !== "production";

  if (enforceRuntimeId && runtimeId && parsed.runtimeId !== runtimeId) {
    return true;
  }

  return now - parsed.lastActivityAt >= APP_SESSION_IDLE_TIMEOUT_MS;
}

export function formatAppSessionRedirectHref(reason: "session-expired" | "session-reset") {
  return `/sign-in?success=${reason}`;
}

export function formatAppSessionExpiryRoute(reason: "session-expired" | "session-reset") {
  return `/auth/session-expired?reason=${reason}`;
}

export function getAppSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}
