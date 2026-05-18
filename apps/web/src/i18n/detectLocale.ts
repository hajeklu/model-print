import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { allUnprefixedSegments } from "./pathSegments";

const STORAGE_KEY = "modelarna-lang";

const UNPREFIXED_SEGMENTS = new Set(allUnprefixedSegments());

export function getStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLocale(stored)) return stored;
  } catch {
    // localStorage may be blocked in private mode
  }
  return null;
}

export function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

/** Map browser language tag to a supported locale. */
export function localeFromBrowserLanguage(tag: string): Locale | null {
  const code = tag.split("-")[0]?.toLowerCase();
  if (!code) return null;
  if (isLocale(code)) return code;
  return null;
}

/** Prefer saved choice, then browser languages, then Czech. */
export function detectPreferredLocale(): Locale {
  const stored = getStoredLocale();
  if (stored) return stored;

  if (typeof navigator === "undefined") return DEFAULT_LOCALE;

  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const tag of candidates) {
    const match = localeFromBrowserLanguage(tag);
    if (match) return match;
  }

  return DEFAULT_LOCALE;
}

/** Czech routes without a /:lang prefix (/, /objednavka, /dekujeme). */
export function isUnprefixedLocalePath(pathname: string): boolean {
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first) return true;
  if (isLocale(first)) return false;
  return UNPREFIXED_SEGMENTS.has(first);
}
