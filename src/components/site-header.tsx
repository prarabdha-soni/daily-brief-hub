import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ARTICLE_CATEGORIES } from "@/lib/articles.functions";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function SiteHeader() {
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(formatDate(new Date()));
  }, []);

  return (
    <header className="bg-background font-sans">
      {/* Top utility bar */}
      <div className="border-b border-border/70">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground/80">
          <div className="flex items-center gap-4">
            <span>{date}</span>
            <span className="hidden border-l border-border/70 pl-4 text-primary md:inline">
              SENSEX 74,320 <span className="text-emerald-700">+0.4%</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="transition-colors hover:text-primary">
              Admin
            </Link>
            <span className="hidden cursor-pointer transition-colors hover:text-primary sm:inline">
              Subscribe
            </span>
            <span className="hidden cursor-pointer transition-colors hover:text-primary sm:inline">
              Sign In
            </span>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="mx-4 border-b-[3px] border-foreground pt-8 pb-4 text-center md:mx-8">
        <Link to="/" className="inline-block">
          <h1 className="font-serif text-5xl font-bold tracking-tight md:text-7xl">
            BHARAT <span className="text-primary">PULSE</span>
          </h1>
          <p className="mt-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground md:text-xs">
            News that moves the nation
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mx-4 mb-6 border-b border-foreground md:mx-8">
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 py-2 font-sans text-sm font-bold uppercase tracking-tight">
          {ARTICLE_CATEGORIES.map((cat) => (
            <li key={cat}>
              <Link
                to="/"
                search={{ category: cat }}
                className="border-b-2 border-transparent pb-1 transition-colors hover:border-primary hover:text-primary"
              >
                {cat}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-neutral-900 px-4 py-12 text-white md:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 border-b border-neutral-700 pb-8 md:flex-row md:items-center">
          <div>
            <p className="font-serif text-2xl font-bold tracking-tight">
              BHARAT <span className="text-primary">PULSE</span>
            </p>
            <p className="mt-2 font-sans text-[11px] uppercase tracking-widest text-neutral-400">
              © {new Date().getFullYear()} Bharat Pulse. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 font-sans text-xs font-medium uppercase tracking-tight text-neutral-300">
            <span className="cursor-pointer hover:text-primary">About</span>
            <span className="cursor-pointer hover:text-primary">Contact</span>
            <span className="cursor-pointer hover:text-primary">Help</span>
            <span className="cursor-pointer hover:text-primary">Terms</span>
            <span className="cursor-pointer hover:text-primary">Privacy</span>
          </div>
        </div>
        <p className="max-w-2xl font-sans text-[10px] leading-relaxed text-neutral-500">
          Bharat Pulse is India's independent news organization. Our mission is to deliver
          rigorous, ethical, and fearless journalism that informs the citizens of the nation.
        </p>
      </div>
    </footer>
  );
}
