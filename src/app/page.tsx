import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { listArticles } from "@/lib/articles.queries";
import type { Article } from "@/lib/articles";

// Articles are read straight from MongoDB rather than fetch(), so Next cannot
// infer this route is dynamic and would otherwise prerender it at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bharat Pulse — India & Global news, analysis",
  description:
    "News, analysis from Bharat Pulse on the latest in Indian politics, business, markets, tech, sports and world affairs.",
  openGraph: {
    title: "Bharat Pulse",
    description: "Without fear and without favour.",
  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 36e5);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 6e4))} min ago`;
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function articleHref(a: Article) {
  return `/article/${a.slug}`;
}

function LeadArticle({ a }: { a: Article }) {
  return (
    <Link href={articleHref(a)} className="group block">
      <span className="mb-1 block font-serif text-sm italic text-primary">{a.category}</span>
      <h2 className="mb-3 font-serif text-3xl font-bold leading-tight decoration-primary decoration-1 group-hover:underline md:text-4xl">
        {a.title}
      </h2>
      {a.subtitle && (
        <p className="mb-4 font-sans text-sm leading-relaxed text-foreground/70">{a.subtitle}</p>
      )}
      {a.cover_image_url && (
        <img
          src={a.cover_image_url}
          alt=""
          className="mb-4 aspect-[16/9] w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="flex items-center gap-2 font-sans text-[11px] font-bold uppercase text-muted-foreground">
        <span>{timeAgo(a.published_at)}</span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span>{a.author}</span>
      </div>
    </Link>
  );
}

function SubLead({ a }: { a: Article }) {
  return (
    <Link href={articleHref(a)} className="group block">
      <span className="mb-1 block font-serif text-xs italic text-primary">{a.category}</span>
      <h3 className="mb-2 font-serif text-lg font-bold leading-snug group-hover:underline">
        {a.title}
      </h3>
      {a.subtitle && (
        <p className="font-sans text-xs text-foreground/60 line-clamp-2">{a.subtitle}</p>
      )}
    </Link>
  );
}

function OpinionItem({ a, withQuote }: { a: Article; withQuote?: boolean }) {
  return (
    <Link href={articleHref(a)} className="group relative block">
      {withQuote && (
        <span className="absolute -left-2 top-0 font-serif text-4xl font-bold text-primary opacity-20">
          “
        </span>
      )}
      <h3
        className={`mb-2 font-serif text-base font-bold leading-tight group-hover:underline ${withQuote ? "pl-4" : ""}`}
      >
        {a.title}
      </h3>
      <p className={`font-sans text-xs text-muted-foreground ${withQuote ? "pl-4" : ""}`}>
        By {a.author}
      </p>
    </Link>
  );
}

function LatestItem({ a }: { a: Article }) {
  const time = new Date(a.published_at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return (
    <Link href={articleHref(a)} className="group flex gap-3">
      <span className="shrink-0 font-sans text-sm font-bold text-primary">{time}</span>
      <p className="font-sans text-xs font-medium leading-snug group-hover:text-primary">
        {a.title}
      </p>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border bg-card p-12 text-center">
      <h2 className="font-serif text-2xl font-bold">No articles yet</h2>
      <p className="mt-2 font-sans text-sm text-muted-foreground">
        Head to the{" "}
        <Link href="/admin" className="text-primary underline">
          admin panel
        </Link>{" "}
        to publish your first story.
      </p>
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { articles } = await listArticles();
  const filtered = category ? articles.filter((a) => a.category === category) : articles;

  const lead = filtered[0];
  const sublead = filtered.slice(1, 3);
  const opinion = filtered.slice(3, 6);
  const latest = filtered.slice(6, 12);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 pb-20 md:px-8">
        {category && (
          <div className="mb-6 flex items-baseline justify-between border-b-2 border-foreground pb-2">
            <h2 className="font-serif text-2xl font-bold">{category}</h2>
            <Link href="/" className="font-sans text-xs text-primary underline">
              ← All sections
            </Link>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Primary Column */}
            <div className="md:col-span-6 md:border-r md:border-border md:pr-8">
              {lead && <LeadArticle a={lead} />}
              {sublead.length > 0 && (
                <>
                  <hr className="my-8 border-border" />
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {sublead.map((a) => (
                      <SubLead key={a.id} a={a} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Opinion Column */}
            <aside className="md:col-span-3 md:border-r md:border-border md:pr-8">
              <h4 className="mb-4 border-b border-foreground pb-1 font-sans text-xs font-bold uppercase">
                Opinion & Analysis
              </h4>
              {opinion.length === 0 ? (
                <p className="font-sans text-xs text-muted-foreground">No opinions yet.</p>
              ) : (
                <div className="space-y-6">
                  {opinion.map((a, i) => (
                    <div key={a.id} className={i > 0 ? "border-t border-border pt-6" : ""}>
                      <OpinionItem a={a} withQuote={i === 0} />
                    </div>
                  ))}
                </div>
              )}
            </aside>

            {/* Latest Column */}
            <aside className="md:col-span-3">
              <h4 className="mb-4 border-b border-foreground pb-1 font-sans text-xs font-bold uppercase">
                Latest Updates
              </h4>
              {latest.length === 0 ? (
                <p className="font-sans text-xs text-muted-foreground">No updates yet.</p>
              ) : (
                <ul className="space-y-4">
                  {latest.map((a, i) => (
                    <li key={a.id} className={i > 0 ? "border-t border-border pt-4" : ""}>
                      <LatestItem a={a} />
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/"
                className="mt-6 block border border-foreground py-2 text-center font-sans text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
              >
                View All News
              </Link>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
