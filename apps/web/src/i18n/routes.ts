import { SITE_URL } from "@/lib/site";
import { DEFAULT_LOCALE, isLocale, isPrefixedLocale, type Locale } from "./config";
import { getPageFromSegment, getPageSegment, type AppPage } from "./pathSegments";

export type { AppPage } from "./pathSegments";

export function getPageFromPath(pathname: string): AppPage {
  const last = pathname.split("/").filter(Boolean).pop();
  if (!last) return "home";
  const page = getPageFromSegment(last);
  return page ?? "home";
}

export function getLocaleFromPath(pathname: string): Locale {
  const first = pathname.split("/").filter(Boolean)[0];
  if (first && isLocale(first) && isPrefixedLocale(first)) {
    return first;
  }
  return DEFAULT_LOCALE;
}

export function localizedPath(locale: Locale, page: AppPage = "home"): string {
  if (page === "home") {
    return isPrefixedLocale(locale) ? `/${locale}` : "/";
  }
  const segment = getPageSegment(locale, page);
  return isPrefixedLocale(locale) ? `/${locale}/${segment}` : `/${segment}`;
}

export function absoluteUrl(
  locale: Locale,
  page: AppPage,
  siteUrl = SITE_URL,
): string {
  return `${siteUrl}${localizedPath(locale, page)}`;
}
