import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader, SiteFooter } from "@/components/site-header";
import { getArticle } from "@/lib/articles.queries";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

// getArticle is wrapped in React cache(), so this and the page body share a
// single query per request rather than hitting MongoDB twice.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { article } = await getArticle(slug);
  if (!article) return { title: "Article — Bharat Pulse" };

  return {
    title: `${article.title} — Bharat Pulse`,
    description: article.subtitle ?? article.title,
    openGraph: {
      title: article.title,
      description: article.subtitle ?? "",
      ...(article.cover_image_url ? { images: [article.cover_image_url] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const { article: a } = await getArticle(slug);
  if (!a) notFound();

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
          <p className="mt-4 font-serif text-xl leading-snug text-muted-foreground">{a.subtitle}</p>
        )}

        <div className="mt-6 flex items-center justify-between border-y border-border py-3 font-sans text-sm">
          <span className="font-semibold">{a.author}</span>
          <span className="text-muted-foreground">{date}</span>
        </div>

        {a.cover_image_url && (
          <img src={a.cover_image_url} alt="" className="my-8 aspect-[16/9] w-full object-cover" />
        )}

        <article
          className="tiptap-content mt-8 text-foreground"
          dangerouslySetInnerHTML={{ __html: a.body }}
        />

        <div className="mt-12 border-t border-border pt-6">
          <Link href="/" className="font-sans text-sm text-primary underline">
            ← Back to home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
