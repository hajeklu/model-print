import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE } from "./config";
import cs from "./locales/cs.json";
import en from "./locales/en.json";
import de from "./locales/de.json";
import pl from "./locales/pl.json";
import it from "./locales/it.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";

void i18n.use(initReactI18next).init({
  resources: {
    cs: { translation: cs },
    en: { translation: en },
    de: { translation: de },
    pl: { translation: pl },
    it: { translation: it },
    es: { translation: es },
    fr: { translation: fr },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: "en",
  supportedLngs: ["en", "cs", "de", "pl", "it", "es", "fr"],
  interpolation: { escapeValue: false },
});

export default i18n;
