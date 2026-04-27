import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { getAppSessionCookieOptions } from "@/lib/auth/app-session";

export const LOCAL_JSON_SESSION_COOKIE_NAME = "kmsf-local-auth-session";

type LocalJsonSessionCookie = {
  userId: string;
  issuedAt: number;
};

const runtimeStore = globalThis as typeof globalThis & {
  __kmsfLocalJsonSessionSecret?: string;
};

const LOCAL_JSON_SESSION_SECRET =
  runtimeStore.__kmsfLocalJsonSessionSecret ??
  (runtimeStore.__kmsfLocalJsonSessionSecret =
    process.env.KMSF_LOCAL_AUTH_SESSION_SECRET ?? randomUUID());

function signLocalSessionPayload(payload: string) {
  return createHmac("sha256", LOCAL_JSON_SESSION_SECRET).update(payload).digest("base64url");
}

function signaturesMatch(a: string, b: string) {
  const left = Buffer.from(a, "base64url");
  const right = Buffer.from(b, "base64url");

  return left.length === right.length && timingSafeEqual(left, right);
}

export function createLocalJsonSessionCookieValue(session: LocalJsonSessionCookie) {
  const userId = encodeURIComponent(session.userId);
  const payload = `${userId}.${session.issuedAt}`;
  const signature = signLocalSessionPayload(payload);

  return `${payload}.${signature}`;
}

export function parseLocalJsonSessionCookieValue(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const [userIdRaw, issuedAtRaw, signature] = value.split(".");
  const issuedAt = Number(issuedAtRaw);

  if (!userIdRaw || !Number.isFinite(issuedAt) || !signature) {
    return null;
  }

  const payload = `${userIdRaw}.${issuedAtRaw}`;
  const expected = signLocalSessionPayload(payload);

  if (!signaturesMatch(signature, expected)) {
    return null;
  }

  return {
    userId: decodeURIComponent(userIdRaw),
    issuedAt,
  };
}

export async function setLocalJsonSessionCookie(userId: string, issuedAt = Date.now()) {
  const cookieStore = await cookies();

  cookieStore.set(
    LOCAL_JSON_SESSION_COOKIE_NAME,
    createLocalJsonSessionCookieValue({ userId, issuedAt }),
    getAppSessionCookieOptions(),
  );
}

export async function clearLocalJsonSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(LOCAL_JSON_SESSION_COOKIE_NAME);
}

export async function getLocalJsonSessionUserId() {
  const cookieStore = await cookies();
  const parsed = parseLocalJsonSessionCookieValue(
    cookieStore.get(LOCAL_JSON_SESSION_COOKIE_NAME)?.value,
  );

  return parsed?.userId ?? null;
}
