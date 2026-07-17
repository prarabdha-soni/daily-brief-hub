import "server-only";

import { cache } from "react";

import { getDb } from "./mongo.server";
import { toArticle, type Article, type ArticleDoc, type ArticleFull } from "./articles";

export async function getArticlesCollection() {
  const db = await getDb();
  return db.collection<ArticleDoc>("articles");
}

export const listArticles = cache(async (): Promise<{ articles: Article[] }> => {
  try {
    const col = await getArticlesCollection();
    const docs = await col
      .find(
        {},
        {
          projection: {
            slug: 1,
            title: 1,
            subtitle: 1,
            category: 1,
            author: 1,
            cover_image_url: 1,
            published_at: 1,
          },
        },
      )
      .sort({ published_at: -1 })
      .limit(60)
      .toArray();

    const articles: Article[] = docs.map((d) => ({
      id: d._id.toHexString(),
      slug: d.slug,
      title: d.title,
      subtitle: d.subtitle ?? null,
      category: d.category,
      author: d.author,
      cover_image_url: d.cover_image_url ?? null,
      published_at:
        d.published_at instanceof Date ? d.published_at.toISOString() : String(d.published_at),
    }));
    return { articles };
  } catch (e) {
    console.error("listArticles error", e);
    return { articles: [] };
  }
});

// Cached per-request: the article route calls this from both generateMetadata
// and the page component, and cache() collapses that into one query.
export const getArticle = cache(async (slug: string): Promise<{ article: ArticleFull | null }> => {
  try {
    const col = await getArticlesCollection();
    const doc = await col.findOne({ slug });
    return { article: doc ? toArticle(doc) : null };
  } catch (e) {
    console.error("getArticle error", e);
    return { article: null };
  }
});
