import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FORMATS } from "@/lib/format-info";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Index = () => {
  const ready = FORMATS.filter((f) => f.group === "ready");
  const arch = FORMATS.filter((f) => f.group === "architectural");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative grain overflow-hidden border-b border-border">
        <div className="container py-24 md:py-36 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <div className="tag mb-6">
              <span className="h-1.5 w-1.5 bg-primary" /> 01 / Studio fyzických modelů
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[0.95] mb-6">
              Váš projekt.<br />
              <span className="text-primary">Na stole.</span><br />
              V měřítku.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8">
              Nahrajte 3D model svého domu, pavilonu nebo studie a my z něj
              vyrobíme hmotný model, který si můžete vzít do ruky a ukázat
              klientovi.
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg" className="font-mono uppercase tracking-wider">
                <Link to="/objednavka">Nahrát model →</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-mono uppercase tracking-wider">
                <a href="#jak-to-funguje">Jak to funguje</a>
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
                  <div className="text-muted-foreground">měřítko · 24h výroba</div>
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

      {/* JAK TO FUNGUJE */}
      <section id="jak-to-funguje" className="container py-24">
        <div className="tag mb-4">02 / Postup</div>
        <h2 className="text-4xl md:text-5xl font-bold mb-16 max-w-2xl">
          Od souboru k hotovému modelu za 4 kroky.
        </h2>
        <div className="grid md:grid-cols-4 gap-px bg-border border border-border">
          {[
            { n: "01", t: "Nahrajete model", d: "Drag & drop souboru z vašeho rýsovacího programu nebo přímo STL." },
            { n: "02", t: "Vyberete parametry", d: "Měřítko, barva, kvalita detailu. Cenu vidíte hned." },
            { n: "03", t: "Potvrdíme zakázku", d: "Do 24 h pošleme finální cenu a termín. Bez závazku." },
            { n: "04", t: "Pošleme model", d: "Pečlivě zabalený model dorazí kurýrem k vám." },
          ].map((s) => (
            <div key={s.n} className="bg-background p-8">
              <div className="font-mono text-primary text-xs mb-4">{s.n}</div>
              <h3 className="text-xl font-semibold mb-2">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORMATY */}
      <section id="formaty" className="border-y border-border bg-card">
        <div className="container py-24">
          <div className="tag mb-4">03 / Vstupní data</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 max-w-2xl">Co nám můžete poslat.</h2>
          <p className="text-muted-foreground max-w-2xl mb-16">
            Plyne to z většiny CAD a BIM nástrojů — Revit, ArchiCAD, SketchUp,
            Rhino, Fusion 360, Blender. 2D výkresy (DWG, DXF) bohužel nejdou
            tisknout — potřebujeme objemový 3D model.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="h-2 w-2 bg-primary" />
                <h3 className="font-mono uppercase tracking-wider text-sm">Připraveno k tisku</h3>
              </div>
              <div className="space-y-px bg-border">
                {ready.map((f) => (
                  <div key={f.ext} className="bg-background p-4 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-semibold">.{f.ext}</div>
                      <div className="text-xs text-muted-foreground">{f.description}</div>
                    </div>
                    <span className="font-mono text-xs text-primary">● okamžitý odhad</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="h-2 w-2 bg-muted-foreground" />
                <h3 className="font-mono uppercase tracking-wider text-sm">Architektonické — převedeme</h3>
              </div>
              <div className="space-y-px bg-border">
                {arch.map((f) => (
                  <div key={f.ext} className="bg-background p-4 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-semibold">.{f.ext}</div>
                      <div className="text-xs text-muted-foreground">{f.description}</div>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">● cena do 24 h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="border border-border bg-card p-12 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-1/3 bg-primary" />
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nahrajte projekt a uvidíte cenu hned.</h2>
              <p className="text-muted-foreground">Bez registrace. Stačí email.</p>
            </div>
            <div className="md:justify-self-end">
              <Button asChild size="lg" className="font-mono uppercase tracking-wider">
                <Link to="/objednavka">Spustit objednávku →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container pb-24">
        <div className="tag mb-4">04 / FAQ</div>
        <h2 className="text-4xl md:text-5xl font-bold mb-12 max-w-2xl">Časté otázky.</h2>
        <Accordion type="single" collapsible className="max-w-3xl">
          <AccordionItem value="1">
            <AccordionTrigger>Jaké měřítko je nejvhodnější pro rodinný dům?</AccordionTrigger>
            <AccordionContent>
              Nejčastěji 1:100 (vejde se na stůl, čitelné okna a balkony) nebo 1:200
              pro větší usedlosti a sady budov. 1:50 volíme jen pro detaily a interiéry.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="2">
            <AccordionTrigger>Z jakého materiálu modely jsou?</AccordionTrigger>
            <AccordionContent>
              Standardně biopolymer PLA — pevný, dlouhodobě stálý a recyklovatelný.
              Vyrábíme aditivní technologií FDM ve vrstvách 0,12–0,2 mm.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="3">
            <AccordionTrigger>Co když je model „prázdný" — bez tloušťky stěn?</AccordionTrigger>
            <AccordionContent>
              Ozveme se. Často stačí jednoduchá úprava (extrude stěn na 1–2 mm
              v měřítku tisku). Pokud nechcete řešit, doupravíme to za vás
              v rámci nabídky.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="4">
            <AccordionTrigger>Proč nepřijímáte DWG nebo DXF?</AccordionTrigger>
            <AccordionContent>
              Tyto formáty jsou typicky 2D půdorysy a řezy — chybí jim objem,
              takže z nich nelze přímo vyrobit hmotný model. Pokud máte jen
              výkresy, napište nám — nabízíme i samostatné modelování.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="5">
            <AccordionTrigger>Jak dlouho trvá výroba?</AccordionTrigger>
            <AccordionContent>
              Standardní zakázka 5–10 pracovních dní od potvrzení. Expres do
              48 h za příplatek.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
