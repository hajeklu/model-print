import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { LOCALES, LOCALE_HTML_LANG, type Locale } from "@/i18n/config";
import { absoluteUrl, type AppPage } from "@/i18n/routes";
import { useLocale } from "@/hooks/useLocale";
import {
  SITE_BRAND,
  SITE_EMAIL,
  SITE_PHONE_E164,
  SITE_URL,
} from "@/lib/site";

interface SeoHeadProps {
  page?: AppPage;
}

export const SeoHead = ({ page = "home" }: SeoHeadProps) => {
  const { t } = useTranslation();
  const locale = useLocale();
  const canonical = absoluteUrl(locale, page);
  const ogLocale = LOCALE_HTML_LANG[locale].replace("-", "_");

  return (
    <Helmet htmlAttributes={{ lang: LOCALE_HTML_LANG[locale] }}>
      <title>{t("seo.title")}</title>
      <meta name="description" content={t("seo.description")} />
      <meta name="keywords" content={t("seo.keywords")} />
      <link rel="canonical" href={canonical} />

      {LOCALES.map((loc) => (
        <link
          key={loc}
          rel="alternate"
          hrefLang={LOCALE_HTML_LANG[loc]}
          href={absoluteUrl(loc, page)}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={absoluteUrl("en", page)} />

      <meta property="og:site_name" content={SITE_BRAND} />
      <meta property="og:title" content={t("seo.ogTitle")} />
      <meta property="og:description" content={t("seo.ogDescription")} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={ogLocale} />
      {LOCALES.filter((loc) => loc !== locale).map((loc) => (
        <meta
          key={loc}
          property="og:locale:alternate"
          content={LOCALE_HTML_LANG[loc].replace("-", "_")}
        />
      ))}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t("seo.ogTitle")} />
      <meta name="twitter:description" content={t("seo.ogDescription")} />

      <script type="application/ld+json">
        {JSON.stringify(buildJsonLd(locale, page, t("seo.description")))}
      </script>
    </Helmet>
  );
};

function buildJsonLd(locale: Locale, page: AppPage, description: string) {
  const url = absoluteUrl(locale, page);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_BRAND,
        url: SITE_URL,
        email: SITE_EMAIL,
        telephone: SITE_PHONE_E164,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Prague",
          addressCountry: "CZ",
        },
        areaServed: {
          "@type": "GeoCircle",
          geoMidpoint: { "@type": "GeoCoordinates", latitude: 50.0755, longitude: 14.4378 },
          geoRadius: "3000000",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_BRAND,
        description,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: locale,
      },
      {
        "@type": "WebPage",
        "@id": `${url}/#webpage`,
        url,
        name: SITE_BRAND,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: locale,
      },
      {
        "@type": "Service",
        name: "Physical 3D architectural models",
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: "Europe",
        description,
      },
    ],
  };
}
