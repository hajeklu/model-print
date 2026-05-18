import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleLayout } from "@/components/LocaleLayout";
import Index from "./pages/Index.tsx";
import Order from "./pages/Order.tsx";
import ThankYou from "./pages/ThankYou.tsx";
import NotFound from "./pages/NotFound.tsx";
import { LOCALES, isPrefixedLocale } from "@/i18n/config";
import { getPageSegment } from "@/i18n/pathSegments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<LocaleLayout />}>
              {/* Czech (unprefixed) */}
              <Route path="/" element={<Index />} />
              <Route path={`/${getPageSegment("cs", "order")}`} element={<Order />} />
              <Route path={`/${getPageSegment("cs", "thankYou")}`} element={<ThankYou />} />

              {/* Prefixed locales with localized slugs */}
              {LOCALES.filter(isPrefixedLocale).map((locale) => (
                <Route key={locale} path={`/${locale}`}>
                  <Route index element={<Index />} />
                  <Route path={getPageSegment(locale, "order")} element={<Order />} />
                  <Route path={getPageSegment(locale, "thankYou")} element={<ThankYou />} />
                </Route>
              ))}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
