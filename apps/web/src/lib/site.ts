/** Public site identity — keep in sync with modelarna.cz DNS and email. */
export const SITE_BRAND = "Modelarna";

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? "https://modelarna.cz"
).replace(/\/$/, "");

export const SITE_EMAIL = "ahoj@modelarna.cz";
export const SITE_PHONE_E164 = "+420777000000";
export const SITE_PHONE_DISPLAY = "+420 777 000 000";
