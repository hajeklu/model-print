import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/hooks/useLocale";
import { getPageFromPath, localizedPath } from "@/i18n/routes";

export const SiteHeader = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const locale = useLocale();
  const home = localizedPath(locale, "home");
  const orderPath = localizedPath(locale, "order");
  const isOrderPage = getPageFromPath(pathname) === "order";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to={home} className="flex items-center gap-2 shrink-0">
          <div className="h-6 w-6 border-2 border-primary" />
          <span className="font-mono text-sm uppercase tracking-widest">{t("common.brand")}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-mono uppercase tracking-wider">
          <a href={`${home}#jak-to-funguje`} className="text-muted-foreground hover:text-foreground transition">
            {t("common.navHow")}
          </a>
          <a href={`${home}#formaty`} className="text-muted-foreground hover:text-foreground transition">
            {t("common.navFormats")}
          </a>
          <a href={`${home}#faq`} className="text-muted-foreground hover:text-foreground transition">
            {t("common.navFaq")}
          </a>
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          {!isOrderPage && (
            <Button asChild size="sm" className="font-mono uppercase tracking-wider">
              <Link to={orderPath}>{t("common.uploadModel")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
