import { createHash, timingSafeEqual } from "node:crypto";

import { cookies, headers } from "next/headers";

import { getAppUrl } from "@/lib/supabase/env";

export const CSRF_COOKIE_NAME = "kmsf-csrf-token";

function hashToken(value: string) {
  return createHash("sha256").update(value).digest();
}

export async function getCsrfToken() {
  const headerStore = await headers();
  const requestToken = headerStore.get("x-kmsf-csrf-token");

  if (requestToken) {
    return requestToken;
  }

  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? "";
}

export async function verifyCsrfToken(formData: FormData) {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = headerStore.get("host");
  const appOrigin = new URL(getAppUrl()).origin;

  if (origin === appOrigin) {
    return true;
  }

  if (origin && forwardedHost && forwardedProto) {
    const forwardedOrigin = `${forwardedProto}://${forwardedHost}`;
    if (origin === forwardedOrigin) {
      return true;
    }
  }

  if (origin && host) {
    const requestOrigin = `${appOrigin.startsWith("https://") ? "https" : "http"}://${host}`;
    if (origin === requestOrigin) {
      return true;
    }
  }

  const submitted = String(formData.get("csrfToken") ?? "");
  const cookieToken = await getCsrfToken();

  if (!submitted || !cookieToken) {
    return false;
  }

  const submittedHash = hashToken(submitted);
  const cookieHash = hashToken(cookieToken);

  return timingSafeEqual(submittedHash, cookieHash);
}
