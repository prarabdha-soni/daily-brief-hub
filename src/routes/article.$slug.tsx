import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getArticle } from "@/lib/articles.functions";
import { SiteHeader, SiteFooter } from "@/components/site-header";

const articleQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["article", slug],
    queryFn: () => getArticle({ data: { slug } }),
  });

export const Route = createFileRoute("/article/$slug")({
  loader: async ({ context, params }) => {
    const result = await context.queryClient.ensureQueryData(articleQueryOptions(params.slug));
    if (!result.article) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    if (!a) return { meta: [{ title: "Article — Bharat Pulse" }] };
    return {
      meta: [
        { title: `${a.title} — Bharat Pulse` },
        { name: "description", content: a.subtitle ?? a.title },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.subtitle ?? "" },
        ...(a.cover_image_url ? [{ property: "og:image", content: a.cover_image_url }] : []),
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div className="p-8 text-center font-sans">Couldn't load article: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-serif text-4xl font-bold">Article not found</h1>
        <Link to="/" className="mt-4 inline-block font-sans text-sm text-primary underline">
          ← Back to home
        </Link>
      </div>
    </div>
  ),
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(articleQueryOptions(slug));
  const a = data.article!;

  const date = new Date(a.published_at).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="mb-3 font-sans text-xs font-bold uppercase tracking-wider text-primary">
          {a.category}
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">{a.title}</h1>
        {a.subtitle && (
          <p className="mt-4 font-serif text-xl leading-snug text-muted-foreground">
            {a.subtitle}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between border-y border-border py-3 font-sans text-sm">
          <span className="font-semibold">{a.author}</span>
          <span className="text-muted-foreground">{date}</span>
        </div>

        {a.cover_image_url && (
          <img
            src={a.cover_image_url}
            alt=""
            className="my-8 aspect-[16/9] w-full object-cover"
          />
        )}

        <article
          className="tiptap-content mt-8 text-foreground"
          dangerouslySetInnerHTML={{ __html: a.body }}
        />

        <div className="mt-12 border-t border-border pt-6">
          <Link to="/" className="font-sans text-sm text-primary underline">
            ← Back to home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
