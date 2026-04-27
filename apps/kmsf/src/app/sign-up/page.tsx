import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { SignUpForm } from "@/components/auth/_components/sign-up-form";
import { GoogleMark } from "@/components/auth/_components/google-mark";
import { Button } from "@/components/ui/button";
import { getAppLocale } from "@/i18n/current-locale";
import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { isLocalJsonAuthEnabled } from "@/lib/auth/providers/auth-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/security/csrf";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isInitialSetupRequired } from "@/lib/supabase/manager";
import { signInWithGoogleAction } from "@/app/[locale]/(public)/sign-in/actions";

type SignUpPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  await searchParams;
  const setupRequired = isLocalJsonAuthEnabled() ? false : await isInitialSetupRequired();
  const user = await getCurrentUser();
  const locale = await getAppLocale();
  const t = await getTranslations({ locale, namespace: "signUp" });
  const csrfToken = await getCsrfToken();
  const supabaseReady = isSupabaseConfigured();

  if (user) {
    if (!(await isRequestAppSessionActive())) {
      redirect(formatAppSessionExpiryRoute("session-expired"));
    }

    redirect("/dashboard");
  }

  if (setupRequired) {
    redirect("/setup/initial-admin");
  }

  return (
    <main className="h-[100dvh] overflow-y-auto bg-background">
      <div className="flex min-h-full flex-col items-center justify-center p-4 py-12">
        <section className="w-full max-w-md rounded-[28px] border border-border bg-surface p-8 text-foreground shadow-[0_20px_60px_rgba(16,185,129,0.08)] dark:shadow-none">
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

        <form action={signInWithGoogleAction} className="mt-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <Button className="w-full" disabled={!supabaseReady} type="submit" variant="secondary">
            <GoogleMark />
            {t("google")}
          </Button>
        </form>

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
