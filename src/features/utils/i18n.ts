import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import environment from "@config/environment";

const languageDefault = "fr";
const languageAvailable = ["fr", "en"];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: languageDefault,
    supportedLngs: languageAvailable,
    backend: {
      loadPath: "/locales/{{lng}}.json?v=" + environment.version,
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      bindI18n: "languageChanged",
      bindI18nStore: "",
      transEmptyNodeValue: "",
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["br", "strong", "i"],
      useSuspense: true,
    },
  });

export default i18n;
