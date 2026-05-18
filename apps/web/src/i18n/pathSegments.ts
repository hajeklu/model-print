import { DEFAULT_LOCALE, LOCALES, type Locale } from "./config";

export type AppPage = "home" | "order" | "thankYou";

const PAGE_SEGMENTS: Record<Locale, Record<Exclude<AppPage, "home">, string>> = {
  cs: { order: "objednavka", thankYou: "dekujeme" },
  en: { order: "order", thankYou: "thank-you" },
  de: { order: "bestellung", thankYou: "danke" },
  pl: { order: "zamowienie", thankYou: "dziekujemy" },
  it: { order: "ordine", thankYou: "grazie" },
  es: { order: "pedido", thankYou: "gracias" },
  fr: { order: "commande", thankYou: "merci" },
};

export function getPageSegment(locale: Locale, page: Exclude<AppPage, "home">): string {
  return PAGE_SEGMENTS[locale][page];
}

/** All path slugs used by any locale (for route registration). */
export function allOrderSegments(): string[] {
  return [...new Set(LOCALES.map((l) => PAGE_SEGMENTS[l].order))];
}

export function allThankYouSegments(): string[] {
  return [...new Set(LOCALES.map((l) => PAGE_SEGMENTS[l].thankYou))];
}

export function allUnprefixedSegments(): string[] {
  return [PAGE_SEGMENTS[DEFAULT_LOCALE].order, PAGE_SEGMENTS[DEFAULT_LOCALE].thankYou];
}

export function getPageFromSegment(segment: string): Exclude<AppPage, "home"> | null {
  for (const locale of LOCALES) {
    if (PAGE_SEGMENTS[locale].order === segment) return "order";
    if (PAGE_SEGMENTS[locale].thankYou === segment) return "thankYou";
  }
  return null;
}
