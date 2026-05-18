import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FORMATS } from "@/lib/format-info";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocale } from "@/hooks/useLocale";
import { localizedPath } from "@/i18n/routes";

const Index = () => {
  const { t } = useTranslation();
  const locale = useLocale();
  const orderPath = localizedPath(locale, "order");
  const ready = FORMATS.filter((f) => f.group === "ready");
  const arch = FORMATS.filter((f) => f.group === "architectural");

  const steps = [
    { n: "01", t: t("home.step1Title"), d: t("home.step1Desc") },
    { n: "02", t: t("home.step2Title"), d: t("home.step2Desc") },
    { n: "03", t: t("home.step3Title"), d: t("home.step3Desc") },
    { n: "04", t: t("home.step4Title"), d: t("home.step4Desc") },
  ];

  const faqs = [
    { q: t("home.faq1q"), a: t("home.faq1a") },
    { q: t("home.faq2q"), a: t("home.faq2a") },
    { q: t("home.faq3q"), a: t("home.faq3a") },
    { q: t("home.faq4q"), a: t("home.faq4a") },
    { q: t("home.faq5q"), a: t("home.faq5a") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHead page="home" />
      <SiteHeader />

      <section className="relative grain overflow-hidden border-b border-border">
        <div className="container py-24 md:py-36 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <div className="tag mb-6">
              <span className="h-1.5 w-1.5 bg-primary" /> {t("home.heroTag")}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[0.95] mb-6">
              {t("home.heroTitle1")}<br />
              <span className="text-primary">{t("home.heroTitle2")}</span><br />
              {t("home.heroTitle3")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8">{t("home.heroLead")}</p>
            <div className="flex gap-4 flex-wrap">
              <Button asChild size="lg" className="font-mono uppercase tracking-wider">
                <Link to={orderPath}>{t("home.heroCta")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-mono uppercase tracking-wider">
                <a href="#jak-to-funguje">{t("home.heroHow")}</a>
              </Button>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="relative aspect-square border border-border bg-card overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-12">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-border/30" />
                ))}
              </div>
              <div className="absolute inset-8 flex flex-col justify-between font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>MODEL.STL</span>
                  <span className="text-primary">● READY</span>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">1:100</div>
                  <div className="text-muted-foreground">{t("home.heroScale")}</div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-muted-foreground">
                  <div><div className="text-foreground text-base">182</div>mm X</div>
                  <div><div className="text-foreground text-base">240</div>mm Y</div>
                  <div><div className="text-foreground text-base">96</div>mm Z</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="jak-to-funguje" className="container py-24">
        <div className="tag mb-4">{t("home.stepsTag")}</div>
        <h2 className="text-4xl md:text-5xl font-bold mb-16 max-w-2xl">{t("home.stepsTitle")}</h2>
        <div className="grid md:grid-cols-4 gap-px bg-border border border-border">
          {steps.map((s) => (
            <div key={s.n} className="bg-background p-8">
              <div className="font-mono text-primary text-xs mb-4">{s.n}</div>
              <h3 className="text-xl font-semibold mb-2">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="formaty" className="border-y border-border bg-card">
        <div className="container py-24">
          <div className="tag mb-4">{t("home.formatsTag")}</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 max-w-2xl">{t("home.formatsTitle")}</h2>
          <p className="text-muted-foreground max-w-2xl mb-16">{t("home.formatsLead")}</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="h-2 w-2 bg-primary" />
                <h3 className="font-mono uppercase tracking-wider text-sm">{t("home.formatsReady")}</h3>
              </div>
              <div className="space-y-px bg-border">
                {ready.map((f) => (
                  <div key={f.ext} className="bg-background p-4 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-semibold">.{f.ext}</div>
                      <div className="text-xs text-muted-foreground">{t(`formats.${f.ext}`)}</div>
                    </div>
                    <span className="font-mono text-xs text-primary">{t("home.badgeInstant")}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="h-2 w-2 bg-muted-foreground" />
                <h3 className="font-mono uppercase tracking-wider text-sm">{t("home.formatsArch")}</h3>
              </div>
              <div className="space-y-px bg-border">
                {arch.map((f) => (
                  <div key={f.ext} className="bg-background p-4 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-semibold">.{f.ext}</div>
                      <div className="text-xs text-muted-foreground">{t(`formats.${f.ext}`)}</div>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{t("home.badge24h")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-24">
        <div className="border border-border bg-card p-12 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-1/3 bg-primary" />
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.ctaTitle")}</h2>
              <p className="text-muted-foreground">{t("home.ctaLead")}</p>
            </div>
            <div className="md:justify-self-end">
              <Button asChild size="lg" className="font-mono uppercase tracking-wider">
                <Link to={orderPath}>{t("home.ctaButton")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="container pb-24">
        <div className="tag mb-4">{t("home.faqTag")}</div>
        <h2 className="text-4xl md:text-5xl font-bold mb-12 max-w-2xl">{t("home.faqTitle")}</h2>
        <Accordion type="single" collapsible className="max-w-3xl">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={String(i + 1)}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent>{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
