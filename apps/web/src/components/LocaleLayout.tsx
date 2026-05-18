import { Navigate, Outlet, useParams } from "react-router-dom";
import { BrowserLocaleRedirect } from "@/components/BrowserLocaleRedirect";
import { CanonicalPathRedirect } from "@/components/CanonicalPathRedirect";
import { isLocale, isPrefixedLocale } from "@/i18n/config";
import { useLocaleSync } from "@/hooks/useLocale";

export const LocaleLayout = () => {
  const { lang } = useParams<{ lang?: string }>();
  useLocaleSync();

  if (lang && (!isLocale(lang) || !isPrefixedLocale(lang))) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <BrowserLocaleRedirect />
      <CanonicalPathRedirect />
      <Outlet />
    </>
  );
};
