import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DEFAULT_LOCALE, isLocale, LOCALE_BCP47, type Locale } from "@/i18n/config";
import { setStoredLocale } from "@/i18n/detectLocale";
import { getLocaleFromPath, getPageFromPath, localizedPath, type AppPage } from "@/i18n/routes";

export function useLocale(): Locale {
  const { lang } = useParams<{ lang?: string }>();
  const { pathname } = useLocation();
  if (lang && isLocale(lang)) return lang;
  return getLocaleFromPath(pathname);
}

export function useLocaleSync() {
  const locale = useLocale();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
    document.documentElement.lang = locale;
  }, [locale, i18n]);
}

export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const locale = useLocale();

  return (page: AppPage, options?: { replace?: boolean; state?: unknown }) => {
    navigate(localizedPath(locale, page), options);
  };
}

export function useFormatLocale(): string {
  const locale = useLocale();
  return LOCALE_BCP47[locale];
}

export function useSwitchLocale() {
  const navigate = useNavigate();
  const location = useLocation();
  const page = getPageFromPath(location.pathname);

  return (newLocale: Locale) => {
    setStoredLocale(newLocale);
    navigate(localizedPath(newLocale, page));
  };
}

export type { AppPage } from "@/i18n/pathSegments";
export { DEFAULT_LOCALE, type Locale };
