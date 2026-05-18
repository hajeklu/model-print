export const LOCALES = ["en", "cs", "de", "pl", "it", "es", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/** Czech uses unprefixed URLs (/, /objednavka). All other locales use /:lang/... */
export const DEFAULT_LOCALE: Locale = "cs";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  cs: "Čeština",
  de: "Deutsch",
  pl: "Polski",
  it: "Italiano",
  es: "Español",
  fr: "Français",
};

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en",
  cs: "cs",
  de: "de",
  pl: "pl",
  it: "it",
  es: "es",
  fr: "fr",
};

export const LOCALE_BCP47: Record<Locale, string> = {
  en: "en-GB",
  cs: "cs-CZ",
  de: "de-DE",
  pl: "pl-PL",
  it: "it-IT",
  es: "es-ES",
  fr: "fr-FR",
};

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function isPrefixedLocale(locale: Locale): boolean {
  return locale !== DEFAULT_LOCALE;
}
