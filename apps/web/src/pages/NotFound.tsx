import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SeoHead } from "@/components/SeoHead";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/hooks/useLocale";
import { localizedPath } from "@/i18n/routes";

const NotFound = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const homePath = localizedPath(locale, "home");
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted">
      <SeoHead page="home" />
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t("notFound.title")}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t("notFound.message")}</p>
        <Link to={homePath} className="text-primary underline hover:text-primary/90">
          {t("notFound.backHome")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
