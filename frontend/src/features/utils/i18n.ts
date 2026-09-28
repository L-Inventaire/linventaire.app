import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import environment from "@config/environment";
import { setDefaultOptions } from "date-fns";
import { enUS, fr } from "date-fns/locale";

const languageDefault = "fr";
const languageAvailable = ["fr", "en"];

// Dates formatted with date-fns ("27 sept. 2026", "il y a 5 minutes") follow the
// language of the app, date-fns would otherwise always use English
const setDatesLocale = (language?: string) =>
  setDefaultOptions({ locale: language?.startsWith("en") ? enUS : fr });
setDatesLocale(languageDefault);
i18n.on("languageChanged", setDatesLocale);

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
