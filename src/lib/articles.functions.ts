import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CATEGORIES = [
  "World",
  "US",
  "Companies",
  "Tech",
  "Markets",
  "Opinion",
  "Lex",
  "Work & Careers",
  "Life & Arts",
] as const;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export const listArticles = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("id, slug, title, subtitle, category, author, cover_image_url, published_at")
    .order("published_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("listArticles error", error);
    return { articles: [] as Article[] };
  }
  return { articles: (data ?? []) as Article[] };
});

export const getArticle = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("articles")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) {
      console.error("getArticle error", error);
      return { article: null };
    }
    return { article: row as ArticleFull | null };
  });

const createSchema = z.object({
  password: z.string().min(1).max(200),
  title: z.string().trim().min(3).max(200),
  subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  body: z.string().min(1).max(200_000),
  category: z.enum(CATEGORIES),
  author: z.string().trim().min(1).max(100),
  cover_image_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export const createArticle = createServerFn({ method: "POST" })
  .inputValidator((input) => createSchema.parse(input))
  .handler(async ({ data }) => {
    const adminPw = process.env.ADMIN_PASSWORD;
    if (!adminPw || data.password !== adminPw) {
      throw new Error("Invalid admin password");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const baseSlug = slugify(data.title);
    let slug = baseSlug || `article-${Date.now()}`;
    let attempt = 0;
    while (attempt < 5) {
      const { data: existing } = await supabaseAdmin
        .from("articles")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      attempt += 1;
      slug = `${baseSlug}-${attempt + 1}`;
    }

    const { error, data: inserted } = await supabaseAdmin
      .from("articles")
      .insert({
        slug,
        title: data.title,
        subtitle: data.subtitle || null,
        body: data.body,
        category: data.category,
        author: data.author,
        cover_image_url: data.cover_image_url || null,
      })
      .select("slug")
      .single();

    if (error) {
      console.error("createArticle error", error);
      throw new Error(error.message);
    }
    return { slug: inserted.slug };
  });

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ password: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const adminPw = process.env.ADMIN_PASSWORD;
    return { ok: !!adminPw && data.password === adminPw };
  });

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

export const ARTICLE_CATEGORIES = CATEGORIES;
