import { getTranslations } from "next-intl/server";

import { getAppLocale } from "@/i18n/current-locale";

const rows = [
  ["A-100", "민트 시트", "Ready", "24"],
  ["A-101", "월간 리포트", "Review", "12"],
  ["A-102", "보안 점검표", "Draft", "8"],
];

export default async function DataTableSamplePage() {
  const locale = await getAppLocale();
  const t = await getTranslations({ locale, namespace: "tableSample" });

  return (
    <>
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <h2 className="mt-2 text-base text-foreground/65">{t("subtitle")}</h2>
      </section>

      <section className="content-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted">
              <tr>
                {["id", "name", "status", "count"].map((key) => (
                  <th key={key} className="px-6 py-4 font-medium text-foreground/70">
                    {t(`columns.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-b border-border last:border-b-0">
                  {row.map((cell) => (
                    <td key={cell} className="px-6 py-4">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
