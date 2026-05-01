import { getTranslations } from "next-intl/server";

import { getAppLocale } from "@/i18n/current-locale";

export default async function DashboardPage() {
  const locale = await getAppLocale();
  const t = await getTranslations({ locale, namespace: "dashboard" });

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-2 text-base text-foreground/65">{t("subtitle")}</p>
      <div className="mt-8 rounded-2xl border border-border p-6">
        <p className="text-sm text-foreground/60">Hello, world!</p>
        <p className="mt-2 text-foreground">
          Edit{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
            src/app/[locale]/(protected)/dashboard/page.tsx
          </code>{" "}
          to start building.
        </p>
      </div>
    </section>
  );
}
