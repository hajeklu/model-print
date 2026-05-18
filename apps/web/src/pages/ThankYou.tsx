import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { useLocale, useFormatLocale } from "@/hooks/useLocale";
import { formatPriceEur } from "@/lib/format-price";
import { localizedPath } from "@/i18n/routes";

const ThankYou = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const formatLocale = useFormatLocale();
  const homePath = localizedPath(locale, "home");
  const { state } = useLocation() as {
    state?: { email?: string; price?: number; hasEstimate?: boolean };
  };

  const showEstimate = state?.hasEstimate && state?.price != null;
  const steps = [t("thankYou.step1"), t("thankYou.step2"), t("thankYou.step3")];

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHead page="thankYou" />
      <SiteHeader />

      <main className="flex-1 flex items-center">
        <div className="container py-14 md:py-20 w-full">
          <div className="relative max-w-3xl mx-auto">
            <div
              className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[28rem] w-[28rem] rounded-full bg-primary/[0.07] blur-3xl"
              aria-hidden
            />

            <div className="relative border border-border bg-card shadow-2xl shadow-black/40">
              <div className="absolute top-0 right-0 h-px w-1/2 bg-gradient-to-l from-primary to-transparent" />
              <div className="absolute top-0 left-0 h-16 w-16 border-l-2 border-t-2 border-primary/60" />
              <div className="absolute bottom-0 right-0 h-16 w-16 border-r-2 border-b-2 border-primary/30" />

              <div
                className={
                  showEstimate
                    ? "grid md:grid-cols-[1fr_13rem] lg:grid-cols-[1fr_15rem] md:divide-x divide-border"
                    : undefined
                }
              >
                <div className="p-8 md:p-10 lg:p-12">
                  <div className="flex items-start gap-4 mb-8">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-primary-foreground">
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-primary mb-1.5">
                        {t("thankYou.tag")}
                      </p>
                      <h1 className="text-3xl md:text-[2.35rem] font-bold leading-tight tracking-tight">
                        {t("thankYou.title")}
                      </h1>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed max-w-md">
                    {t("thankYou.body")}
                  </p>

                  {state?.email && (
                    <div className="mt-6 flex items-center gap-3 border border-border bg-background/60 px-4 py-3">
                      <Mail className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                          {t("thankYou.emailLabel")}
                        </p>
                        <p className="font-mono text-sm text-foreground truncate">{state.email}</p>
                      </div>
                    </div>
                  )}

                  <p className="mt-3 text-sm text-muted-foreground">{t("thankYou.emailDeadline")}</p>

                  <div className="mt-10 pt-8 border-t border-border">
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground mb-5">
                      {t("thankYou.nextTitle")}
                    </p>
                    <ol className="space-y-4">
                      {steps.map((step, index) => (
                        <li key={step} className="flex gap-4 text-sm">
                          <span className="font-mono text-xs text-primary tabular-nums pt-px w-5 shrink-0">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-foreground/90 leading-snug">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {showEstimate && (
                  <div className="flex flex-col justify-between border-t md:border-t-0 bg-primary/[0.05] p-8 md:p-10">
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                      {t("thankYou.estimateLabel")}
                    </p>
                    <p className="text-5xl lg:text-6xl font-bold tracking-tight text-primary tabular-nums my-6 md:my-8">
                      {formatPriceEur(state.price!, formatLocale)}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/80 pt-4">
                      {t("thankYou.estimateNote")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Button
                asChild
                variant="outline"
                className="font-mono uppercase tracking-wider w-full sm:w-auto"
              >
                <Link to={homePath} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {t("thankYou.backHome")}
                </Link>
              </Button>
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground text-center sm:text-right">
                Modelarna · {t("thankYou.tag")}
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ThankYou;
