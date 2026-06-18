import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { InitialAdminForm } from "@/app/setup/initial-admin/_components/initial-admin-form";
import { getAppLocale } from "@/i18n/current-locale";
import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { resolveRuntimeAuthProvider } from "@/lib/auth/providers/runtime-auth-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/security/csrf";
import { isInitialSetupRequired } from "@/lib/supabase/manager";

type InitialAdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InitialAdminPage({ searchParams }: InitialAdminPageProps) {
  await searchParams;
  const user = await getCurrentUser();
  const setupRequired = await isInitialSetupRequired();
  const locale = await getAppLocale();
  const t = await getTranslations({ locale, namespace: "initialSetup" });
  const csrfToken = await getCsrfToken();
  const runtimeProvider = await resolveRuntimeAuthProvider();

  if (user) {
    if (!(await isRequestAppSessionActive())) {
      redirect(formatAppSessionExpiryRoute("session-expired"));
    }

    redirect("/dashboard");
  }

  if (!setupRequired) {
    redirect("/sign-in");
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-background px-4 pb-16 pt-10 text-foreground">
      <InitialAdminForm
        csrfToken={csrfToken}
        runtimeProvider={runtimeProvider}
        labels={{
          adminDescription: t("steps.admin.description"),
          adminLevel: t("steps.admin.level"),
          adminTitle: t("steps.admin.title"),
          email: t("email"),
          fallbackNotice: t("steps.provider.fallbackNotice", {
            attempts: runtimeProvider.attempts,
          }),
          localDescription: t("steps.provider.local.description"),
          localTitle: t("steps.provider.local.title"),
          layoutDescription: t("steps.layout.description"),
          layoutRegions: {
            footer: {
              description: t("steps.layout.regions.footer.description"),
              title: t("steps.layout.regions.footer.title"),
            },
            left: {
              description: t("steps.layout.regions.left.description"),
              title: t("steps.layout.regions.left.title"),
            },
            right: {
              description: t("steps.layout.regions.right.description"),
              title: t("steps.layout.regions.right.title"),
            },
            top: {
              description: t("steps.layout.regions.top.description"),
              title: t("steps.layout.regions.top.title"),
            },
          },
          layoutTitle: t("steps.layout.title"),
          next: t("next"),
          password: t("password"),
          passwordConfirm: t("passwordConfirm"),
          previous: t("previous"),
          processingDescription: t("steps.processing.description"),
          processingTitle: t("steps.processing.title"),
          providerDescription: t("steps.provider.description"),
          providerTitle: t("steps.provider.title"),
          serverDbBadge: t("steps.provider.serverDb.badge"),
          serverDbDescription: t("steps.provider.serverDb.description"),
          serverDbTitle: t("steps.provider.serverDb.title"),
          supabaseDescription: t("steps.provider.supabase.description"),
          supabaseTitle: t("steps.provider.supabase.title"),
          supabaseUnavailable: t("steps.provider.supabase.unavailable"),
          title: t("title"),
          description: t("description"),
        }}
        messages={{
          authFailed: t("errors.auth"),
          securityFailed: t("errors.security"),
          fieldErrors: {
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
          email: t("tooltips.email"),
          password: t("tooltips.password"),
          passwordConfirm: t("tooltips.passwordConfirm"),
        }}
      />
    </main>
  );
}
