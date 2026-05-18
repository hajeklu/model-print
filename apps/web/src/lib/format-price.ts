/** Format whole-EUR amounts for display (all locales show EUR). */
export function formatPriceEur(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
