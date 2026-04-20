import { getTranslations } from "next-intl/server";

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  return (
    <>
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <h2 className="mt-2 text-base text-foreground/65">{t("subtitle")}</h2>
      </section>

      <section className="content-panel p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {["summary", "activity", "status"].map((key) => (
            <article key={key} className="rounded-2xl border border-border p-5">
              <h3 className="text-lg font-semibold">{t(`${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground/65">
                {t(`${key}.description`)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
