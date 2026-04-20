import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { InitialAdminForm } from "@/app/setup/initial-admin/_components/initial-admin-form";
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
  const t = await getTranslations({ locale: "ko", namespace: "initialSetup" });
  const csrfToken = await getCsrfToken();

  if (user) {
    redirect("/dashboard");
  }

  if (!setupRequired) {
    redirect("/sign-in");
  }

  return (
    <main className="flex flex-col h-[100dvh] items-center bg-background px-4 py-12 overflow-y-auto">
      <section className="my-auto w-full max-w-md rounded-[28px] border border-border bg-surface p-8 text-foreground shadow-[0_20px_60px_rgba(16,185,129,0.08)] dark:shadow-none">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">{t("description")}</p>
        </div>

        <InitialAdminForm
          csrfToken={csrfToken}
          labels={{
            username: t("username"),
            email: t("email"),
            password: t("password"),
            passwordConfirm: t("passwordConfirm"),
            submit: t("submit"),
          }}
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
      </section>
    </main>
  );
}
