import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { detectPreferredLocale, isUnprefixedLocalePath } from "@/i18n/detectLocale";
import { getPageFromPath, localizedPath } from "@/i18n/routes";

/**
 * On Czech unprefixed URLs, redirect once to the visitor's preferred locale
 * (saved choice or browser language).
 */
export const BrowserLocaleRedirect = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;
    if (!isUnprefixedLocalePath(pathname)) return;

    const preferred = detectPreferredLocale();
    if (preferred === DEFAULT_LOCALE) return;

    didRedirect.current = true;
    const page = getPageFromPath(pathname);
    navigate(localizedPath(preferred, page), { replace: true });
  }, [pathname, navigate]);

  return null;
};
