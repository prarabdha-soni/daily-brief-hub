// Shared article types and constants. Safe to import from client components —
// keep this file free of database code. Server reads live in articles.queries.ts
// and mutations in articles.actions.ts.
import type { ObjectId } from "mongodb";

export const ARTICLE_CATEGORIES = [
  "India",
  "Politics",
  "Business",
  "Tech",
  "Markets",
  "Sports",
  "Entertainment",
  "World",
  "Opinion",
  "Lifestyle",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export type Article = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  author: string;
  cover_image_url: string | null;
  published_at: string;
};

export type ArticleFull = Article & {
  body: string;
  created_at: string;
};

export type ArticleDoc = {
  _id: ObjectId;
  slug: string;
  title: string;
  subtitle: string | null;
  body: string;
  category: string;
  author: string;
  cover_image_url: string | null;
  published_at: Date;
  created_at: Date;
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function toArticle(doc: ArticleDoc): ArticleFull {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    title: doc.title,
    subtitle: doc.subtitle,
    body: doc.body,
    category: doc.category,
    author: doc.author,
    cover_image_url: doc.cover_image_url,
    published_at:
      doc.published_at instanceof Date ? doc.published_at.toISOString() : String(doc.published_at),
    created_at:
      doc.created_at instanceof Date ? doc.created_at.toISOString() : String(doc.created_at ?? ""),
  };
}
