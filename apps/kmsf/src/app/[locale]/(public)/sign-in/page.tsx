import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  signInWithGoogleAction,
} from "@/app/[locale]/(public)/sign-in/actions";
import { GoogleMark } from "@/components/auth/_components/google-mark";
import { SignInForm } from "@/components/auth/_components/sign-in-form";
import { Button } from "@/components/ui/button";
import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { isLocalJsonAuthEnabled } from "@/lib/auth/providers/auth-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/security/csrf";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isInitialSetupRequired } from "@/lib/supabase/manager";

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
  const setupRequired = isLocalJsonAuthEnabled() ? false : await isInitialSetupRequired();
  const user = await getCurrentUser();
  const t = await getTranslations({ locale, namespace: "auth" });
  const supabaseReady = isSupabaseConfigured();
  const csrfToken = await getCsrfToken();

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
            {t(`errors.${error}`)}
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

        <form action={signInWithGoogleAction} className="mt-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <Button className="w-full" disabled={!supabaseReady} type="submit" variant="secondary">
            <GoogleMark />
            {t("google")}
          </Button>
        </form>

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
