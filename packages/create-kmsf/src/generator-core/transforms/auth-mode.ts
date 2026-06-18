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
    "src/app/setup",
  ],
  supabase: [
    "src/lib/auth/local-session.server.ts",
    "src/lib/auth/local-session.server.test.ts",
    "src/lib/auth/providers/local-json-auth-store.ts",
    "src/lib/auth/providers/local-json-auth-store.test.ts",
  ],
  later: [],
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

const LOCAL_JSON_ROOT_PAGE = `import { redirect } from "next/navigation";

import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { getCurrentUser } from "@/lib/auth/session";

export default async function RootPage() {
  const user = await getCurrentUser();

  if (user && !(await isRequestAppSessionActive())) {
    redirect(formatAppSessionExpiryRoute("session-expired"));
  }

  redirect(user ? "/dashboard" : "/sign-in");
}
`;

const LOCAL_JSON_PROTECTED_LAYOUT = `import { BarChart3, LayoutDashboard, Settings, TableProperties } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getThemeCookie } from "@/lib/auth/demo-session";
import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/security/csrf";

type ProtectedLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProtectedLayout({
  children,
  params,
}: ProtectedLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "navigation" });
  const user = await getCurrentUser();
  const theme = await getThemeCookie();
  const csrfToken = await getCsrfToken();
  // eslint-disable-next-line react-hooks/purity -- server-rendered footer seed must use request-time clock
  const initialServerTime = Date.now();

  if (user && !(await isRequestAppSessionActive())) {
    redirect(formatAppSessionExpiryRoute("session-expired"));
  }

  if (!user) {
    redirect("/sign-in");
  }

  const navItems = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: t("dashboard"),
      caption: t("dashboardCaption"),
    },
    {
      href: "/data-table-sample",
      icon: <TableProperties className="h-4 w-4" />,
      label: t("tableSample"),
      caption: t("tableSampleCaption"),
    },
    {
      href: "/chart-sample",
      icon: <BarChart3 className="h-4 w-4" />,
      label: t("chartSample"),
      caption: t("chartSampleCaption"),
    },
    {
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
      label: t("settings"),
      caption: t("settingsCaption"),
    },
  ];

  return (
    <AppShell
      csrfToken={csrfToken}
      initialTheme={theme}
      initialServerTime={initialServerTime}
      locale={locale}
      navItems={navItems}
      user={user}
    >
      {children}
    </AppShell>
  );
}
`;

const LOCAL_JSON_PROTECTED_ACTIONS = `"use server";

import { redirect } from "next/navigation";

import { clearAppSessionCookie } from "@/lib/auth/app-session.server";
import { clearLocalJsonSessionCookie } from "@/lib/auth/local-session.server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  profileSchema,
  sanitizeEmailInput,
  sanitizeUsernameInput,
} from "@/lib/auth/validation";
import { verifyCsrfToken } from "@/lib/security/csrf";

export async function signOutAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(\`/settings?accountError=security\`);
  }

  await clearLocalJsonSessionCookie();
  await clearAppSessionCookie();
  redirect(\`/sign-in\`);
}

export async function updateProfileAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    return { error: "security" };
  }

  const parsed = profileSchema.safeParse({
    username: sanitizeUsernameInput(String(formData.get("username") ?? "")),
    email: sanitizeEmailInput(String(formData.get("email") ?? "")),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });

  if (!parsed.success) {
    return { error: "validation" };
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { error: "unauthorized" };
  }

  return { success: true };
}

export async function deleteAccountAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(\`/settings?accountError=security\`);
  }

  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();

  if (confirmation !== "DELETE") {
    redirect(\`/settings?accountError=validation\`);
  }

  const { deleteLocalJsonAccount } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(\`/sign-in\`);
  }

  await deleteLocalJsonAccount(currentUser.id);
  await clearLocalJsonSessionCookie();
  await clearAppSessionCookie();

  redirect(\`/sign-in?success=deleted\`);
}

export async function linkGoogleIdentityAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(\`/settings?googleError=security\`);
  }

  redirect(\`/settings?googleError=unavailable\`);
}

export async function unlinkGoogleIdentityAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(\`/settings?googleError=security\`);
  }

  redirect(\`/settings?googleError=unavailable\`);
}
`;

const LOCAL_JSON_SIGNIN_ACTIONS = `"use server";

import { redirect } from "next/navigation";

import { touchAppSessionCookie } from "@/lib/auth/app-session.server";
import { setLocalJsonSessionCookie } from "@/lib/auth/local-session.server";
import {
  accountSchema,
  createEmptyAccountFieldErrors,
  createEmptySignInFieldErrors,
  getAccountFieldErrors,
  sanitizeEmailInput,
  sanitizeUsernameInput,
  getSignInFieldErrors,
  signInSchema,
  type AccountFieldErrors,
  type AccountFields,
  type SignInFieldErrors,
  type SignInFields,
} from "@/lib/auth/validation";
import { verifyCsrfToken } from "@/lib/security/csrf";

export type SignInFormState = {
  authError: "auth" | "security" | null;
  fields: SignInFields;
  fieldErrors: SignInFieldErrors;
};

export type SignUpFormState = {
  authError: "auth" | "security" | null;
  fields: AccountFields;
  fieldErrors: AccountFieldErrors;
};

function buildSignInState(
  fields: SignInFields,
  options?: {
    authError?: SignInFormState["authError"];
    fieldErrors?: Partial<SignInFieldErrors>;
  },
): SignInFormState {
  return {
    authError: options?.authError ?? null,
    fields,
    fieldErrors: {
      ...createEmptySignInFieldErrors(),
      ...options?.fieldErrors,
    },
  };
}

function buildSignUpState(
  fields: AccountFields,
  options?: {
    authError?: SignUpFormState["authError"];
    fieldErrors?: Partial<AccountFieldErrors>;
  },
): SignUpFormState {
  return {
    authError: options?.authError ?? null,
    fields,
    fieldErrors: {
      ...createEmptyAccountFieldErrors(),
      ...options?.fieldErrors,
    },
  };
}

export async function signInAction(
  _prevState: SignInFormState,
  formData: FormData,
) {
  const parsed = signInSchema.safeParse({
    locale: formData.get("locale"),
    username: sanitizeUsernameInput(String(formData.get("username") ?? "")),
    password: formData.get("password"),
  });

  const fields = {
    username: sanitizeUsernameInput(String(formData.get("username") ?? "")),
    password: String(formData.get("password") ?? ""),
  };

  if (!(await verifyCsrfToken(formData))) {
    return buildSignInState(fields, { authError: "security" });
  }

  if (!parsed.success) {
    return buildSignInState(fields, {
      fieldErrors: getSignInFieldErrors(parsed.error),
    });
  }

  const { verifyLocalJsonCredentials } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );
  const account = await verifyLocalJsonCredentials(parsed.data.username, parsed.data.password);

  if (!account) {
    return buildSignInState(fields, { authError: "auth" });
  }

  await setLocalJsonSessionCookie(account.id);
  await touchAppSessionCookie();
  redirect(\`/dashboard\`);
}

export async function signInWithGoogleAction(formData: FormData) {
  if (!(await verifyCsrfToken(formData))) {
    redirect(\`/sign-in?error=security\`);
  }

  redirect(\`/sign-in?error=oauth\`);
}

export async function signUpAction(
  _prevState: SignUpFormState,
  formData: FormData,
) {
  const parsed = accountSchema.safeParse({
    locale: formData.get("locale"),
    username: sanitizeUsernameInput(String(formData.get("username") ?? "")),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    email: sanitizeEmailInput(String(formData.get("email") ?? "")),
  });

  const fields = {
    username: sanitizeUsernameInput(String(formData.get("username") ?? "")),
    email: sanitizeEmailInput(String(formData.get("email") ?? "")),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  };

  if (!(await verifyCsrfToken(formData))) {
    return buildSignUpState(fields, { authError: "security" });
  }

  if (!parsed.success) {
    return buildSignUpState(fields, {
      fieldErrors: getAccountFieldErrors(parsed.error),
    });
  }

  const { createLocalJsonAccount, LocalJsonAuthStoreError } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );
  let account;

  try {
    account = await createLocalJsonAccount({
      username: parsed.data.username,
      email: parsed.data.email,
      password: parsed.data.password,
      role: "member",
    });
  } catch (error) {
    if (error instanceof LocalJsonAuthStoreError) {
      return buildSignUpState(fields, {
        fieldErrors: {
          username: error.code === "duplicate_username" ? "duplicate.username" : null,
          email: error.code === "duplicate_email" ? "duplicate.email" : null,
        },
      });
    }

    console.error("signUpAction local-json failed", { error });
    return buildSignUpState(fields, { authError: "auth" });
  }

  await setLocalJsonSessionCookie(account.id);
  await touchAppSessionCookie();
  redirect(\`/dashboard\`);
}
`;

const LOCAL_JSON_SIGNUP_PAGE = `import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { SignUpForm } from "@/components/auth/_components/sign-up-form";
import { Button } from "@/components/ui/button";
import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/security/csrf";

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ params, searchParams }: SignUpPageProps) {
  const { locale } = await params;
  await searchParams;
  const user = await getCurrentUser();
  const t = await getTranslations({ locale, namespace: "signUp" });
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
        <section className="w-full max-w-md rounded-[var(--kmsf-radius-auth)] border border-border bg-surface p-8 text-foreground shadow-[var(--kmsf-shadow-panel)] dark:shadow-none">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-foreground/65">{t("description")}</p>
        </div>

        <SignUpForm
          csrfToken={csrfToken}
          labels={{
            username: t("username"),
            email: t("email"),
            password: t("password"),
            passwordConfirm: t("passwordConfirm"),
            submit: t("submit"),
          }}
          locale={locale}
          messages={{
            authFailed: t("errors.auth"),
            securityFailed: t("errors.security"),
            fieldErrors: {
              username: {
                invalid: t("fieldErrors.username.invalid"),
                duplicate: t("fieldErrors.username.duplicate"),
              },
              email: {
                invalid: t("fieldErrors.email.invalid"),
                duplicate: t("fieldErrors.email.duplicate"),
              },
              password: {
                invalid: t("fieldErrors.password.invalid"),
              },
              passwordConfirm: {
                invalid: t("fieldErrors.passwordConfirm.invalid"),
                mismatch: t("fieldErrors.passwordConfirm.mismatch"),
              },
            },
          }}
          tooltips={{
            username: t("tooltips.username"),
            email: t("tooltips.email"),
            password: t("tooltips.password"),
            passwordConfirm: t("tooltips.passwordConfirm"),
          }}
        />

        <Link className="mt-3 block" href="/sign-in">
          <Button className="w-full" type="button" variant="secondary">
            {t("backToSignIn")}
          </Button>
        </Link>
      </section>
      </div>
    </main>
  );
}
`;

const LOCAL_JSON_SESSION = `import { cache } from "react";

import { getLocalJsonSessionUserId } from "@/lib/auth/local-session.server";
import { normalizeRole, type AppRole } from "@/lib/auth/roles";

export type AppSessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
  avatarInitials: string;
  avatarDataUrl: string | null;
  authMode: "demo" | "password" | "google" | "supabase" | "local-json";
  isAuthenticated: boolean;
};

function getInitials(value: string) {
  const tokens = value
    .split(/[\\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  return tokens.map((token) => token[0]?.toUpperCase() ?? "").join("") || "KM";
}

export const getCurrentUser = cache(async (): Promise<AppSessionUser | null> => {
  const { findLocalJsonAccountById } = await import(
    "@/lib/auth/providers/local-json-auth-store"
  );
  const userId = await getLocalJsonSessionUserId();
  const localUser = userId ? await findLocalJsonAccountById(userId) : null;

  if (!localUser) {
    return null;
  }

  return {
    id: localUser.id,
    email: localUser.email,
    displayName: localUser.username,
    role: normalizeRole(localUser.role) ?? "member",
    avatarInitials: getInitials(localUser.username),
    avatarDataUrl: null,
    authMode: "local-json",
    isAuthenticated: true,
  };
});
`;

const LOCAL_JSON_CSRF = `import { createHash, timingSafeEqual } from "node:crypto";

import { cookies, headers } from "next/headers";

export const CSRF_COOKIE_NAME = "kmsf-csrf-token";

function hashToken(value: string) {
  return createHash("sha256").update(value).digest();
}

function getConfiguredAppOrigin() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return null;
  }

  try {
    return new URL(appUrl).origin;
  } catch {
    return null;
  }
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
  const configuredOrigin = getConfiguredAppOrigin();

  if (origin && configuredOrigin && origin === configuredOrigin) {
    return true;
  }

  if (origin && forwardedHost && forwardedProto) {
    const forwardedOrigin = \`\${forwardedProto}://\${forwardedHost}\`;
    if (origin === forwardedOrigin) {
      return true;
    }
  }

  if (origin && host) {
    const requestProtocol = configuredOrigin?.startsWith("https://") ? "https" : "http";
    const requestOrigin = \`\${requestProtocol}://\${host}\`;
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
`;

const LOCAL_JSON_SESSION_TOUCH_ROUTE = `import { NextResponse } from "next/server";

import { touchAppSessionCookie } from "@/lib/auth/app-session.server";

export async function POST() {
  await touchAppSessionCookie();

  return new NextResponse(null, { status: 204 });
}
`;

const LOCAL_JSON_SESSION_EXPIRED_ROUTE = `import { redirect } from "next/navigation";

import { clearAppSessionCookie } from "@/lib/auth/app-session.server";
import { clearLocalJsonSessionCookie } from "@/lib/auth/local-session.server";

export async function GET() {
  await clearLocalJsonSessionCookie();
  await clearAppSessionCookie();

  redirect("/sign-in?success=session-expired");
}
`;

const LOCAL_JSON_REPLACEMENTS = new Map<string, string>([
  ["src/app/page.tsx", LOCAL_JSON_ROOT_PAGE],
  ["src/app/[locale]/(protected)/actions.ts", LOCAL_JSON_PROTECTED_ACTIONS],
  ["src/app/[locale]/(protected)/layout.tsx", LOCAL_JSON_PROTECTED_LAYOUT],
  ["src/app/[locale]/(public)/sign-in/actions.ts", LOCAL_JSON_SIGNIN_ACTIONS],
  ["src/app/[locale]/(public)/sign-up/page.tsx", LOCAL_JSON_SIGNUP_PAGE],
  ["src/app/api/session/touch/route.ts", LOCAL_JSON_SESSION_TOUCH_ROUTE],
  ["src/app/auth/session-expired/route.ts", LOCAL_JSON_SESSION_EXPIRED_ROUTE],
  ["src/lib/auth/session.ts", LOCAL_JSON_SESSION],
  ["src/lib/security/csrf.ts", LOCAL_JSON_CSRF],
]);

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

async function writeLocalJsonReplacements(projectRoot: string): Promise<void> {
  for (const [rel, content] of LOCAL_JSON_REPLACEMENTS) {
    const filePath = path.join(projectRoot, rel);

    try {
      await readFile(filePath, "utf8");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw e;
    }

    await writeFile(filePath, content, "utf8");
  }
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
    await writeLocalJsonReplacements(projectRoot);
  }
}
