import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CATEGORIES = [
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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

type ArticleDoc = {
  _id: import("mongodb").ObjectId;
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

async function getArticlesCollection() {
  const { getDb } = await import("./mongo.server");
  const db = await getDb();
  return db.collection<ArticleDoc>("articles");
}

function toArticle(doc: ArticleDoc): ArticleFull {
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
      doc.published_at instanceof Date
        ? doc.published_at.toISOString()
        : String(doc.published_at),
    created_at:
      doc.created_at instanceof Date
        ? doc.created_at.toISOString()
        : String(doc.created_at ?? ""),
  };
}

export const listArticles = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const col = await getArticlesCollection();
    const docs = await col
      .find({}, {
        projection: {
          slug: 1,
          title: 1,
          subtitle: 1,
          category: 1,
          author: 1,
          cover_image_url: 1,
          published_at: 1,
        },
      })
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
        d.published_at instanceof Date
          ? d.published_at.toISOString()
          : String(d.published_at),
    }));
    return { articles };
  } catch (e) {
    console.error("listArticles error", e);
    return { articles: [] as Article[] };
  }
});

export const getArticle = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    try {
      const col = await getArticlesCollection();
      const doc = await col.findOne({ slug: data.slug });
      return { article: doc ? toArticle(doc) : null };
    } catch (e) {
      console.error("getArticle error", e);
      return { article: null };
    }
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

    const col = await getArticlesCollection();
    const baseSlug = slugify(data.title);
    let slug = baseSlug || `article-${Date.now()}`;
    let attempt = 0;
    while (attempt < 5) {
      const existing = await col.findOne({ slug }, { projection: { _id: 1 } });
      if (!existing) break;
      attempt += 1;
      slug = `${baseSlug}-${attempt + 1}`;
    }

    const now = new Date();
    await col.insertOne({
      slug,
      title: data.title,
      subtitle: data.subtitle || null,
      body: data.body,
      category: data.category,
      author: data.author,
      cover_image_url: data.cover_image_url || null,
      published_at: now,
      created_at: now,
    } as ArticleDoc);

    return { slug };
  });

export const verifyAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ password: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const adminPw = process.env.ADMIN_PASSWORD;
    return { ok: !!adminPw && data.password === adminPw };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ password: z.string().min(1).max(200), id: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data }) => {
    const adminPw = process.env.ADMIN_PASSWORD;
    if (!adminPw || data.password !== adminPw) throw new Error("Invalid admin password");
    const { ObjectId } = await import("mongodb");
    let oid: import("mongodb").ObjectId;
    try {
      oid = new ObjectId(data.id);
    } catch {
      throw new Error("Invalid article id");
    }
    const col = await getArticlesCollection();
    const res = await col.deleteOne({ _id: oid });
    if (res.deletedCount === 0) throw new Error("Article not found");
    return { ok: true };
  });

const DUMMY_ARTICLES = [
  {
    slug: "india-g20-presidency-global-impact",
    title: "India's G20 Presidency: Reshaping the Global Order",
    subtitle: "How New Delhi used its year at the helm to amplify voices of the Global South",
    body: "<p>When India assumed the G20 presidency in December 2022, few predicted the degree to which Prime Minister Narendra Modi's government would use the platform to reframe multilateral conversations. Over the following twelve months, New Delhi hosted more than 200 meetings across 60 cities, turning the rotating chairmanship into a nationwide showcase.</p><p>The most consequential outcome was the African Union's admission as a permanent G20 member — a diplomatic coup that New Delhi had lobbied for since the very first sherpa meeting. <strong>\"This is India's gift to the world,\"</strong> External Affairs Minister S. Jaishankar said at the New Delhi Summit in September 2023.</p><p>Economists note that the presidency also accelerated work on a framework for sovereign-debt restructuring, a long-standing demand of lower-income nations struggling with post-pandemic fiscal stress. Whether the framework will translate into binding commitments remains an open question, but the groundwork has been laid.</p>",
    category: "India",
    author: "Meera Iyer",
    cover_image_url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=80",
    published_at: "2024-01-15T08:00:00Z",
  },
  {
    slug: "sensex-record-high-analysis",
    title: "Sensex Crosses 80,000: Rally Built on Solid Foundations or Froth?",
    subtitle: "A deep dive into valuations, foreign flows and what retail investors should know",
    body: "<p>The BSE Sensex's crossing of the 80,000 mark in June 2024 was celebrated on trading floors from Mumbai to Dubai. Foreign institutional investors poured in nearly ₹1.2 lakh crore in the first half of the year, drawn by India's relative macroeconomic stability at a time when China's property sector continued to drag on sentiment.</p><p>Yet not everyone is sanguine. The Nifty 50's price-to-earnings ratio touched 23x forward earnings — a premium to the 10-year average of around 18x. <em>\"Markets are pricing in a lot of good news,\"</em> cautioned Nilesh Shah, managing director of Kotak Mahindra Asset Management. <em>\"Any disappointment on earnings or on the political front could trigger a sharp correction.\"</em></p><p>Retail participation has surged, with SIP inflows crossing ₹20,000 crore a month. Financial planners urge investors to stick to asset-allocation targets rather than chasing momentum.</p>",
    category: "Markets",
    author: "Rohan Desai",
    cover_image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
    published_at: "2024-02-20T09:30:00Z",
  },
  {
    slug: "upi-global-expansion-2024",
    title: "UPI Goes Global: India's Payment Stack Eyes the World",
    subtitle: "From Paris to Singapore, the Unified Payments Interface is rewriting cross-border money movement",
    body: "<p>Standing at a boulangerie near the Eiffel Tower and scanning a QR code with your Indian bank app to buy a croissant is no longer a hypothetical. Since France's BPCE group integrated UPI in mid-2023, Indian tourists have been able to pay in euros directly from their rupee accounts without dynamic currency conversion fees.</p><p>The National Payments Corporation of India (NPCI) has inked bilateral agreements with more than 10 countries, and the volume of cross-border UPI transactions grew 340 percent year-on-year in the first quarter of 2024. NPCI International CEO Ritesh Shukla calls it <strong>\"the democratisation of global payments\"</strong> — a system built on open standards, not proprietary rails controlled by a handful of card networks.</p><p>The geopolitical dimension is equally significant. Washington and Brussels have begun studying UPI's architecture as they search for alternatives to over-reliance on Visa and Mastercard in sensitive corridors.</p>",
    category: "Tech",
    author: "Ananya Krishnan",
    cover_image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
    published_at: "2024-03-05T07:00:00Z",
  },
];

export const seedDummyArticles = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ password: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const adminPw = process.env.ADMIN_PASSWORD;
    if (!adminPw || data.password !== adminPw) throw new Error("Invalid admin password");
    const col = await getArticlesCollection();
    let inserted = 0;
    for (const a of DUMMY_ARTICLES) {
      const existing = await col.findOne({ slug: a.slug }, { projection: { _id: 1 } });
      if (existing) continue;
      const now = new Date();
      await col.insertOne({
        slug: a.slug,
        title: a.title,
        subtitle: a.subtitle ?? null,
        body: a.body,
        category: a.category,
        author: a.author,
        cover_image_url: a.cover_image_url ?? null,
        published_at: new Date(a.published_at),
        created_at: now,
      } as ArticleDoc);
      inserted += 1;
    }
    return { inserted };
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
