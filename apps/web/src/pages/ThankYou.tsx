import { Link, useLocation } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const ThankYou = () => {
  const { state } = useLocation() as { state?: { email?: string; price?: number; hasEstimate?: boolean } };
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container py-24 flex-1">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-primary mb-6" />
          <div className="tag mb-4 mx-auto">Poptávka přijata</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Děkujeme!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Máme váš model a poptávku.
            {state?.email && (
              <> Potvrzení a další kroky vám pošleme na <span className="text-foreground font-mono">{state.email}</span> do 24 hodin.</>
            )}
          </p>

          {state?.hasEstimate && state?.price && (
            <div className="border border-border bg-card p-6 mb-8 inline-block text-left">
              <div className="font-mono uppercase text-xs tracking-wider text-muted-foreground mb-1">Váš orientační odhad</div>
              <div className="text-3xl font-bold">{state.price.toLocaleString("cs-CZ")} Kč</div>
              <div className="text-xs text-muted-foreground mt-2">Finální cenu potvrdíme po kontrole modelu.</div>
            </div>
          )}

          <div>
            <Button asChild variant="outline" className="font-mono uppercase tracking-wider">
              <Link to="/">Zpět na úvod</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default ThankYou;
