import { getTranslations } from "next-intl/server";

import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { canManageAccounts, resolveSettingsSection } from "@/lib/auth/access-policy";
import { getAccountDirectory } from "@/lib/auth/account-directory";
import { getGoogleIdentityState } from "@/lib/auth/google-identity";
import { resolveRuntimeAuthProvider } from "@/lib/auth/providers/runtime-auth-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/security/csrf";
import { readProjectSetupConfig } from "@/lib/setup/project-setup-config";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type SettingsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    profile?: string;
    profileError?: string;
    accountError?: string;
    google?: string;
    googleError?: string;
    section?: string;
    systemResetError?: string;
  }>;
};

export default async function SettingsPage({
  params,
  searchParams,
}: SettingsPageProps) {
  const { locale } = await params;
  const { profile, profileError, accountError, google, googleError, section, systemResetError } =
    await searchParams;
  const t = await getTranslations({ locale, namespace: "settings" });
  const user = await getCurrentUser();
  const csrfToken = await getCsrfToken();
  const runtimeProvider = await resolveRuntimeAuthProvider();
  const setupConfig = await readProjectSetupConfig();
  const canManageAccountSection = canManageAccounts(user);
  const activeSection = resolveSettingsSection(user, section);
  const accountDirectory = canManageAccountSection ? await getAccountDirectory() : null;
  const googleAvailable = isSupabaseConfigured() && runtimeProvider.provider === "supabase";
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

      <SettingsPageContent
        accountDirectory={accountDirectory}
        activeSection={activeSection}
        canManageAccounts={canManageAccountSection}
        csrfToken={csrfToken}
        googleAvailable={googleAvailable}
        googleIdentity={googleIdentity}
        locale={locale}
        runtimeProvider={runtimeProvider}
        setupConfig={setupConfig}
        systemResetError={systemResetError ?? null}
        user={user}
      />
    </>
  );
}
