import { getTranslations } from "next-intl/server";

import { getAppLocale } from "@/i18n/current-locale";

export default async function ChartSamplePage() {
  const locale = await getAppLocale();
  const t = await getTranslations({ locale, namespace: "chartSample" });

  return (
    <>
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <h2 className="mt-2 text-base text-foreground/65">{t("subtitle")}</h2>
      </section>

      <section className="content-panel p-6">
        <div className="chart-grid rounded-2xl border border-border bg-surface p-6">
          <svg aria-hidden="true" className="h-[320px] w-full" viewBox="0 0 1000 320">
            <path
              d="M40 250 C120 200, 220 160, 300 180 S470 270, 560 220 S760 120, 960 150"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
            />
            <path
              d="M40 250 C120 200, 220 160, 300 180 S470 270, 560 220 S760 120, 960 150"
              fill="var(--accent)"
              fillOpacity="0.08"
              stroke="none"
            />
          </svg>
        </div>
      </section>
    </>
  );
}
