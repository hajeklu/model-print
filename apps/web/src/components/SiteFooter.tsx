export const SiteFooter = () => (
  <footer className="border-t border-border mt-24">
    <div className="container py-12 grid gap-8 md:grid-cols-3 text-sm">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-5 border-2 border-primary" />
          <span className="font-mono uppercase tracking-widest">Modelárna</span>
        </div>
        <p className="text-muted-foreground max-w-xs">
          Fyzické modely vašich projektů. Vyrábíme aditivní technologií FDM
          z biopolymeru PLA.
        </p>
      </div>
      <div className="font-mono text-xs uppercase tracking-wider">
        <div className="text-muted-foreground mb-2">Kontakt</div>
        <a href="mailto:ahoj@modelarna.cz" className="block hover:text-primary">ahoj@modelarna.cz</a>
        <a href="tel:+420777000000" className="block hover:text-primary">+420 777 000 000</a>
      </div>
      <div className="font-mono text-xs uppercase tracking-wider">
        <div className="text-muted-foreground mb-2">Provoz</div>
        <div>Po–Pá 9:00–17:00</div>
        <div>Praha, Česko</div>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container py-4 font-mono text-xs text-muted-foreground flex justify-between">
        <span>© {new Date().getFullYear()} Modelárna</span>
        <span>v0.1</span>
      </div>
    </div>
  </footer>
);
