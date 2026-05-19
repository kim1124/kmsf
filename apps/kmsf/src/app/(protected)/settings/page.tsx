import { getTranslations } from "next-intl/server";

import {
  linkGoogleIdentityAction,
  unlinkGoogleIdentityAction,
} from "@/app/[locale]/(protected)/actions";
import { Button } from "@/components/ui/button";
import { getAppLocale } from "@/i18n/current-locale";
import { getGoogleIdentityState } from "@/lib/auth/google-identity";
import { isLocalJsonAuthEnabled } from "@/lib/auth/providers/auth-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/security/csrf";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type SettingsPageProps = {
  searchParams: Promise<{
    profile?: string;
    profileError?: string;
    accountError?: string;
    google?: string;
    googleError?: string;
  }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const { profile, profileError, accountError, google, googleError } = await searchParams;
  const locale = await getAppLocale();
  const t = await getTranslations({ locale, namespace: "settings" });
  const user = await getCurrentUser();
  const csrfToken = await getCsrfToken();
  const googleAvailable = isSupabaseConfigured() && !isLocalJsonAuthEnabled();
  const googleIdentity = googleAvailable
    ? (await getGoogleIdentityState()).state
    : { isLinked: false, canUnlink: false, identity: null };

  return (
    <>
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <h2 className="mt-2 text-base text-foreground/65">{t("description")}</h2>
      </section>

      {profile === "updated" ? (
        <section className="content-panel px-5 py-4 text-sm text-accent">
          {t("profileUpdated")}
        </section>
      ) : null}

      {profileError ? (
        <section className="content-panel px-5 py-4 text-sm text-red-700 dark:text-red-300">
          {t(`profileErrors.${profileError}`)}
        </section>
      ) : null}

      {accountError ? (
        <section className="content-panel px-5 py-4 text-sm text-red-700 dark:text-red-300">
          {t(`accountErrors.${accountError}`)}
        </section>
      ) : null}

      {google ? (
        <section className="content-panel px-5 py-4 text-sm text-accent">
          {t(`googleMessages.${google}`)}
        </section>
      ) : null}

      {googleError ? (
        <section className="content-panel px-5 py-4 text-sm text-red-700 dark:text-red-300">
          {t(`googleErrors.${googleError}`)}
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="content-panel p-6">
          <h3 className="text-lg font-semibold">{t("profileTitle")}</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/65">{t("profileDescription")}</p>
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
              <dt className="text-sm text-foreground/60">{t("fields.name")}</dt>
              <dd className="mt-2 font-medium">{user?.displayName}</dd>
            </div>
            <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
              <dt className="text-sm text-foreground/60">{t("fields.email")}</dt>
              <dd className="mt-2 font-medium">{user?.email}</dd>
            </div>
            <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
              <dt className="text-sm text-foreground/60">{t("fields.role")}</dt>
              <dd className="mt-2 font-medium">{user?.role}</dd>
            </div>
            <div className="rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
              <dt className="text-sm text-foreground/60">{t("fields.auth")}</dt>
              <dd className="mt-2 font-medium">
                {user?.authMode ? t(`authModes.${user.authMode}`) : t("authModes.demo")}
              </dd>
            </div>
          </dl>
        </article>

        <article className="content-panel p-6">
          <h3 className="text-lg font-semibold">{t("securityTitle")}</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/65">{t("securityDescription")}</p>
          <ul className="mt-6 space-y-3 text-sm leading-7 text-foreground/70">
            <li>{t("securityItems.password")}</li>
            <li>{t("securityItems.google")}</li>
            <li>{t("securityItems.mfa")}</li>
          </ul>
          <div className="mt-6 rounded-[var(--kmsf-radius-xl)] border border-border bg-surface p-4">
            <p className="text-sm font-medium text-foreground">{t("googleIdentity.title")}</p>
            <p className="mt-2 text-sm leading-6 text-foreground/65">
              {googleAvailable
                ? googleIdentity.isLinked
                  ? t("googleIdentity.linked")
                  : t("googleIdentity.notLinked")
                : t("googleIdentity.unavailable")}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {googleIdentity.isLinked ? (
                <form action={unlinkGoogleIdentityAction}>
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <Button
                    className="w-full"
                    disabled={!googleIdentity.canUnlink}
                    type="submit"
                    variant="secondary"
                  >
                    {t("googleIdentity.unlink")}
                  </Button>
                </form>
              ) : (
                <form action={linkGoogleIdentityAction}>
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <Button className="w-full" disabled={!googleAvailable} type="submit">
                    {t("googleIdentity.link")}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
