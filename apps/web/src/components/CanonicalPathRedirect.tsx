import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";
import { getPageFromPath, localizedPath } from "@/i18n/routes";

/** Redirects legacy or wrong slugs (e.g. /en/objednavka) to locale-correct paths (/en/order). */
export const CanonicalPathRedirect = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const locale = useLocale();

  useEffect(() => {
    const page = getPageFromPath(pathname);
    const canonical = localizedPath(locale, page);
    if (pathname !== canonical) {
      navigate(canonical, { replace: true });
    }
  }, [pathname, locale, navigate]);

  return null;
};
