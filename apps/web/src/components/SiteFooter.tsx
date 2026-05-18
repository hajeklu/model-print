import { useTranslation } from "react-i18next";
import { SITE_EMAIL, SITE_PHONE_DISPLAY, SITE_PHONE_E164 } from "@/lib/site";

export const SiteFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border mt-24">
      <div className="container py-12 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-5 border-2 border-primary" />
            <span className="font-mono uppercase tracking-widest">{t("common.brand")}</span>
          </div>
          <p className="text-muted-foreground max-w-xs">{t("common.footerTagline")}</p>
        </div>
        <div className="font-mono text-xs uppercase tracking-wider">
          <div className="text-muted-foreground mb-2">{t("common.contact")}</div>
          <a href={`mailto:${SITE_EMAIL}`} className="block hover:text-primary">
            {SITE_EMAIL}
          </a>
          <a href={`tel:${SITE_PHONE_E164}`} className="block hover:text-primary">
            {SITE_PHONE_DISPLAY}
          </a>
        </div>
        <div className="font-mono text-xs uppercase tracking-wider">
          <div className="text-muted-foreground mb-2">{t("common.hours")}</div>
          <div>{t("common.hoursValue")}</div>
          <div>{t("common.location")}</div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-4 font-mono text-xs text-muted-foreground flex justify-between">
          <span>{t("common.copyright", { year: new Date().getFullYear() })}</span>
          <span>v0.1</span>
        </div>
      </div>
    </footer>
  );
};
