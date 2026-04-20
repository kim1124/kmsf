import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/auth/session";

type SettingsPageProps = {
  searchParams: Promise<{ profile?: string; profileError?: string; accountError?: string }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const { profile, profileError, accountError } = await searchParams;
  const t = await getTranslations({ locale: "ko", namespace: "settings" });
  const user = await getCurrentUser();

  return (
    <>
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <h2 className="mt-2 text-base text-foreground/65">{t("description")}</h2>
      </section>

      {profile === "updated" ? (
        <section className="content-panel px-5 py-4 text-sm text-mint-700 dark:text-mint-300">
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

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="content-panel p-6">
          <h3 className="text-lg font-semibold">{t("profileTitle")}</h3>
          <p className="mt-2 text-sm leading-6 text-foreground/65">{t("profileDescription")}</p>
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-border bg-surface p-4">
              <dt className="text-sm text-foreground/60">{t("fields.name")}</dt>
              <dd className="mt-2 font-medium">{user?.displayName}</dd>
            </div>
            <div className="rounded-[24px] border border-border bg-surface p-4">
              <dt className="text-sm text-foreground/60">{t("fields.email")}</dt>
              <dd className="mt-2 font-medium">{user?.email}</dd>
            </div>
            <div className="rounded-[24px] border border-border bg-surface p-4">
              <dt className="text-sm text-foreground/60">{t("fields.role")}</dt>
              <dd className="mt-2 font-medium">{user?.role}</dd>
            </div>
            <div className="rounded-[24px] border border-border bg-surface p-4">
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
        </article>
      </section>
    </>
  );
}
