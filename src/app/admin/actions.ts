"use server";

// The admin panel loads the article list from a client component, which cannot
// import the server-only query module directly. This action is the bridge.
// It exposes only what the public homepage already renders, so it needs no
// password check.
import { listArticles } from "@/lib/articles.queries";

export async function listArticlesForAdmin() {
  return listArticles();
}
