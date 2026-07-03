import { useTranslation } from "react-i18next";
import { appConfig } from "../global/app-config";
import { useAppStore } from "../stores/app-store";

export function HomePage() {
  const { t } = useTranslation();
  const visits = useAppStore((state) => state.visits);
  const increaseVisits = useAppStore((state) => state.increaseVisits);

  return (
    <section className="page-section">
      <p className="eyebrow">{t("home.eyebrow")}</p>
      <h1>{appConfig.name}</h1>
      <p>{t("home.description")}</p>
      <button type="button" onClick={increaseVisits}>
        {t("home.visitButton", { count: visits })}
      </button>
    </section>
  );
}
