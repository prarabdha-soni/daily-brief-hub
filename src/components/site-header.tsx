import { Link } from "@tanstack/react-router";
import { ARTICLE_CATEGORIES } from "@/lib/articles.functions";

export function SiteHeader() {
  const date = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="border-b border-border bg-background">
      <div className="border-b border-border/60">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-2 text-xs font-sans text-muted-foreground">
          <span>{date}</span>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="hover:text-primary transition-colors">
              Admin
            </Link>
            <span className="hidden sm:inline">Subscribe</span>
            <span className="hidden sm:inline">Sign In</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-5 text-center">
        <Link to="/" className="inline-block">
          <h1 className="font-serif text-3xl font-black tracking-tight sm:text-5xl">
            BHARAT<span className="text-primary">PULSE</span>
          </h1>
          <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            News that moves the nation
          </p>
        </Link>
      </div>

      <nav className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-[1280px] gap-5 overflow-x-auto px-4 py-3 font-sans text-sm font-semibold">
          {ARTICLE_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to="/"
              search={{ category: cat }}
              className="whitespace-nowrap text-foreground transition-colors hover:text-primary"
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-[1280px] px-4 py-10 font-sans text-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className="font-serif text-2xl font-bold">
              BHARAT<span className="text-primary">PULSE</span>
            </p>
            <p className="mt-2 text-background/70">
              © {new Date().getFullYear()} BharatPulse. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6 text-background/80">
            <span>About</span>
            <span>Help</span>
            <span>Terms</span>
            <span>Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
