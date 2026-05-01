// AI-NOTE: This module strips or replaces auth-related files in a freshly
// scaffolded project so the resulting app compiles in the chosen auth mode.
// IMMUTABLE RULES (do not weaken without re-deciding):
//   1. Caller assumes the project root has just been copied from
//      templates/next-app-base; missing files therefore mean "skip silently"
//      (no error). This keeps applyAuthMode safe for partial templates and
//      for "none" mode chained after a previous mode.
//   2. local-json must produce a sign-in page that compiles WITHOUT the
//      @/lib/supabase tree. Regex surgery proved too fragile against
//      multi-line imports and intertwined supabase calls in the body, so the
//      page is REPLACED wholesale with a known-good template instead of
//      being patched in place.
//   3. The generator never edits apps/kmsf source — only the user's freshly
//      scaffolded copy.

import { rm, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { AuthMode } from "../types.js";

/** Paths to remove for each auth mode (relative to project root). */
const REMOVAL_MAP: Record<AuthMode, string[]> = {
  "local-json": [
    "src/lib/supabase",
    "src/lib/auth/google-identity.ts",
    "src/lib/auth/google-identity.test.ts",
    "src/app/auth/callback",
  ],
  supabase: [
    "src/lib/auth/local-session.server.ts",
    "src/lib/auth/local-session.server.test.ts",
    "src/lib/auth/providers/local-json-auth-store.ts",
    "src/lib/auth/providers/local-json-auth-store.test.ts",
  ],
  none: [
    "src/lib/auth",
    "src/lib/supabase",
    "src/components/auth",
    "src/app/[locale]/(public)",
    "src/app/auth",
    "src/app/api/session",
    "src/app/setup",
  ],
};

const SIGNIN_PAGE_REL = "src/app/[locale]/(public)/sign-in/page.tsx";

/**
 * Clean sign-in page for local-json mode. No supabase imports, no Google
 * OAuth, no isInitialSetupRequired branch. Mirrors the styling of the
 * original page so visual regression is minimal.
 *
 * Q1 RESOLUTION: replaced the prior regex-based stripping (which only
 * matched single-line imports and missed @/lib/supabase/manager) with this
 * fresh replacement. See the AI-NOTE at the top of this file.
 */
const LOCAL_JSON_SIGNIN_PAGE = `import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { SignInForm } from "@/components/auth/_components/sign-in-form";
import { Button } from "@/components/ui/button";
import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/security/csrf";

type SignInPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function SignInPage({
  params,
  searchParams,
}: SignInPageProps) {
  const { locale } = await params;
  const { error, success } = await searchParams;
  const user = await getCurrentUser();
  const t = await getTranslations({ locale, namespace: "auth" });
  const csrfToken = await getCsrfToken();

  if (user) {
    if (!(await isRequestAppSessionActive())) {
      redirect(formatAppSessionExpiryRoute("session-expired"));
    }

    redirect("/dashboard");
  }

  return (
    <main className="h-[100dvh] overflow-y-auto bg-background">
      <div className="flex min-h-full flex-col items-center justify-center p-4 py-12">
        <section className="w-full max-w-md rounded-[28px] border border-border bg-surface p-8 text-foreground shadow-[0_20px_60px_rgba(16,185,129,0.08)] dark:shadow-none">
          <div className="text-center">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
          </div>

          {success === "confirm-email" ? (
            <div className="mt-5 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-800">
              {t("confirmEmail")}
            </div>
          ) : null}

          {success === "deleted" ? (
            <div className="mt-5 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-800">
              {t("accountDeleted")}
            </div>
          ) : null}

          {success === "session-expired" ? (
            <div className="mt-5 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-800">
              {t("sessionExpired")}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
              {t(\`errors.\${error}\`)}
            </div>
          ) : null}

          <SignInForm
            csrfToken={csrfToken}
            labels={{
              username: t("username"),
              password: t("password"),
              submit: t("signIn"),
            }}
            locale={locale}
            messages={{
              authFailed: t("errors.auth"),
              securityFailed: t("errors.security"),
              fieldErrors: {
                username: {
                  invalid: t("fieldErrors.username.invalid"),
                },
                password: {
                  invalid: t("fieldErrors.password.invalid"),
                },
              },
            }}
            tooltips={{
              username: t("tooltips.username"),
              password: t("tooltips.password"),
            }}
          />

          <Link className="mt-3 block" href="/sign-up">
            <Button className="w-full" type="button" variant="secondary">
              {t("signUp")}
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
}
`;

/**
 * Replace the sign-in page with a local-json-only variant.
 * No-op when the file is missing (e.g. caller already ran "none" mode).
 */
async function writeLocalJsonSignIn(projectRoot: string): Promise<void> {
  const filePath = path.join(projectRoot, SIGNIN_PAGE_REL);
  // Ensure parent dir exists (test fixtures sometimes start without it).
  await mkdir(path.dirname(filePath), { recursive: true });

  // Check if the supabase-flavored sign-in page existed; we still write our
  // replacement either way, but skipping when the entire (public) tree was
  // already removed (none mode) keeps the function idempotent.
  try {
    await readFile(filePath, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
    throw e;
  }

  await writeFile(filePath, LOCAL_JSON_SIGNIN_PAGE, "utf8");
}

export async function applyAuthMode(projectRoot: string, mode: AuthMode): Promise<void> {
  const removals = REMOVAL_MAP[mode];
  for (const rel of removals) {
    const full = path.join(projectRoot, rel);
    await rm(full, { recursive: true, force: true });
  }

  // local-json: replace sign-in page with a clean variant (no Google OAuth,
  // no supabase imports). Q1 follow-up — see AI-NOTE.
  if (mode === "local-json") {
    await writeLocalJsonSignIn(projectRoot);
  }
}
