import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const SiteHeader = () => {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-6 w-6 border-2 border-primary" />
          <span className="font-mono text-sm uppercase tracking-widest">Modelárna</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-mono uppercase tracking-wider">
          <a href="/#jak-to-funguje" className="text-muted-foreground hover:text-foreground transition">Jak to funguje</a>
          <a href="/#formaty" className="text-muted-foreground hover:text-foreground transition">Formáty</a>
          <a href="/#faq" className="text-muted-foreground hover:text-foreground transition">FAQ</a>
        </nav>
        {pathname !== "/objednavka" && (
          <Button asChild size="sm" className="font-mono uppercase tracking-wider">
            <Link to="/objednavka">Nahrát model</Link>
          </Button>
        )}
      </div>
    </header>
  );
};
