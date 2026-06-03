import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listArticles, type Article } from "@/lib/articles.functions";
import { SiteHeader, SiteFooter } from "@/components/site-header";

const articlesQueryOptions = queryOptions({
  queryKey: ["articles"],
  queryFn: () => listArticles(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Financial Times — World, US & Global business news" },
      {
        name: "description",
        content:
          "News, analysis from the Financial Times on the latest in markets, economy and business in the UK, US, China and the rest of the world.",
      },
      { property: "og:title", content: "Financial Times" },
      { property: "og:description", content: "Without fear and without favour." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(articlesQueryOptions),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center font-sans">Couldn't load articles: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Not found</div>,
  component: HomePage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ArticleHeroCard({ a }: { a: Article }) {
  return (
    <Link
      to="/article/$slug"
      params={{ slug: a.slug }}
      className="group block border-b border-border pb-6"
    >
      {a.cover_image_url && (
        <img
          src={a.cover_image_url}
          alt=""
          className="mb-4 aspect-[16/9] w-full object-cover"
          loading="lazy"
        />
      )}
      <p className="mb-2 font-sans text-xs font-bold uppercase tracking-wider text-primary">
        {a.category}
      </p>
      <h2 className="font-serif text-3xl font-bold leading-tight text-foreground group-hover:underline sm:text-4xl">
        {a.title}
      </h2>
      {a.subtitle && (
        <p className="mt-3 font-serif text-lg leading-snug text-muted-foreground">
          {a.subtitle}
        </p>
      )}
      <p className="mt-3 font-sans text-xs text-muted-foreground">
        {a.author} · {formatDate(a.published_at)}
      </p>
    </Link>
  );
}

function ArticleListItem({ a, showImage = false }: { a: Article; showImage?: boolean }) {
  return (
    <Link
      to="/article/$slug"
      params={{ slug: a.slug }}
      className="group block border-b border-border py-4"
    >
      {showImage && a.cover_image_url && (
        <img
          src={a.cover_image_url}
          alt=""
          className="mb-3 aspect-[16/9] w-full object-cover"
          loading="lazy"
        />
      )}
      <p className="mb-1 font-sans text-[11px] font-bold uppercase tracking-wider text-primary">
        {a.category}
      </p>
      <h3 className="font-serif text-xl font-bold leading-tight text-foreground group-hover:underline">
        {a.title}
      </h3>
      {a.subtitle && (
        <p className="mt-1 font-serif text-sm text-muted-foreground line-clamp-2">{a.subtitle}</p>
      )}
      <p className="mt-2 font-sans text-[11px] text-muted-foreground">
        {a.author} · {formatDate(a.published_at)}
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
        <Link to="/admin" className="text-primary underline">
          admin panel
        </Link>{" "}
        to publish your first story.
      </p>
    </div>
  );
}

function HomePage() {
  const { data } = useSuspenseQuery(articlesQueryOptions);
  const search = Route.useSearch();
  const all = data.articles;
  const filtered = search.category
    ? all.filter((a) => a.category === search.category)
    : all;

  const [lead, ...rest] = filtered;
  const secondary = rest.slice(0, 4);
  const tertiary = rest.slice(4, 10);
  const more = rest.slice(10);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-8">
        {search.category && (
          <div className="mb-6 flex items-baseline justify-between border-b-2 border-foreground pb-2">
            <h2 className="font-serif text-2xl font-bold">{search.category}</h2>
            <Link to="/" className="font-sans text-xs text-primary underline">
              ← All sections
            </Link>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">{lead && <ArticleHeroCard a={lead} />}</div>
              <div className="space-y-1 lg:border-l lg:border-border lg:pl-8">
                <p className="mb-3 font-sans text-xs font-bold uppercase tracking-wider">
                  Top stories
                </p>
                {secondary.map((a) => (
                  <ArticleListItem key={a.id} a={a} />
                ))}
              </div>
            </div>

            {tertiary.length > 0 && (
              <section className="mt-12 border-t-2 border-foreground pt-6">
                <h2 className="mb-6 font-serif text-2xl font-bold">Latest</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {tertiary.map((a) => (
                    <ArticleListItem key={a.id} a={a} showImage />
                  ))}
                </div>
              </section>
            )}

            {more.length > 0 && (
              <section className="mt-12 border-t-2 border-foreground pt-6">
                <h2 className="mb-6 font-serif text-2xl font-bold">More from FT</h2>
                <div className="grid gap-1 sm:grid-cols-2">
                  {more.map((a) => (
                    <ArticleListItem key={a.id} a={a} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
