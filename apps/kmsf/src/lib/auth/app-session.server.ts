import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

import {
  APP_SESSION_COOKIE_NAME,
  createAppSessionCookieValue,
  getAppSessionCookieOptions,
  isAppSessionExpired,
  parseAppSessionCookieValue,
} from "./app-session";

const runtimeStore = globalThis as typeof globalThis & {
  __kmsfAppSessionRuntimeId?: string;
};

const APP_SESSION_RUNTIME_ID =
  runtimeStore.__kmsfAppSessionRuntimeId ?? (runtimeStore.__kmsfAppSessionRuntimeId = randomUUID());

export async function touchAppSessionCookie(activityAt = Date.now()) {
  const cookieStore = await cookies();
  const current = parseAppSessionCookieValue(cookieStore.get(APP_SESSION_COOKIE_NAME)?.value);
  const nextValue = createAppSessionCookieValue({
    runtimeId: APP_SESSION_RUNTIME_ID,
    issuedAt: current?.issuedAt ?? activityAt,
    lastActivityAt: activityAt,
  });

  cookieStore.set(APP_SESSION_COOKIE_NAME, nextValue, getAppSessionCookieOptions());
}

export async function clearAppSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(APP_SESSION_COOKIE_NAME);
}

export async function isRequestAppSessionActive() {
  const cookieStore = await cookies();
  return !isAppSessionExpired(cookieStore.get(APP_SESSION_COOKIE_NAME)?.value, {
    runtimeId: APP_SESSION_RUNTIME_ID,
    enforceRuntimeId: process.env.NODE_ENV !== "production",
  });
}
