import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./messages";

void i18next.use(initReactI18next).init({
  resources,
  lng: "ko",
  fallbackLng: "ko",
  interpolation: {
    escapeValue: false,
  },
});

export { i18next };
