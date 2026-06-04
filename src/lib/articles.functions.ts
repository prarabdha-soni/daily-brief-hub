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

export const deleteArticle = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ password: z.string().min(1).max(200), id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const adminPw = process.env.ADMIN_PASSWORD;
    if (!adminPw || data.password !== adminPw) throw new Error("Invalid admin password");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
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
  {
    slug: "ipl-2024-season-review",
    title: "IPL 2024: Records Fall, Revenues Soar and the Cricket Economy Booms",
    subtitle: "The seventeenth edition cemented T20 cricket's status as a global entertainment juggernaut",
    body: "<p>The Indian Premier League's 2024 edition broke nearly every commercial record in its 17-year history. Total broadcast viewership crossed 620 million unique viewers across JioCinema and Star Sports — figures that rival the Super Bowl's global reach. Franchise valuations, per a Duff & Phelps report, averaged $1.1 billion, with Mumbai Indians topping the list at $1.8 billion.</p><p>On the field, a new generation of bowlers stole the show. Jasprit Bumrah's economy rate of 6.8 in the powerplay overs defied every analysts' model of T20 bowling, while uncapped leg-spinner Ravi Bishnoi took 25 wickets to finish as the tournament's top wicket-taker.</p><p>The women's Premier League, held concurrently for the second year, drew sold-out crowds in Mumbai and Delhi — a sign that women's cricket is finally commanding the premium it long deserved.</p>",
    category: "Sports",
    author: "Vikram Nair",
    cover_image_url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80",
    published_at: "2024-04-01T10:00:00Z",
  },
  {
    slug: "india-semiconductor-mission",
    title: "India's Semiconductor Bet: Can the Chip Mission Deliver?",
    subtitle: "Three approved fabs, billions in incentives — but the hardest work lies ahead",
    body: "<p>When the Union Cabinet approved India's ₹76,000-crore semiconductor incentive scheme in 2021, many industry veterans were sceptical. Chip fabrication is among the most capital-intensive, technically demanding industries in the world — dominated by a handful of companies in Taiwan, South Korea and the United States.</p><p>Three years on, the landscape has shifted. The Tata Group's collaboration with Taiwan's Powerchip Semiconductor to build a fab in Dholera, Gujarat, has moved from MoU to groundbreaking. Micron's $2.75-billion assembly and testing facility in Sanand is on track to begin production in late 2025.</p><p><em>\"India is not trying to compete with TSMC at 3 nanometres,\"</em> says Nasscom chairman Rajesh Nambiar. <em>\"We are building a base in legacy nodes and advanced packaging — segments where there is genuine global supply-chain anxiety.\"</em> The strategy is pragmatic, if unspectacular.</p>",
    category: "Business",
    author: "Priya Sharma",
    cover_image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    published_at: "2024-05-12T06:30:00Z",
  },
  {
    slug: "chandrayaan-3-science-findings",
    title: "Chandrayaan-3: What India Found at the Moon's South Pole",
    subtitle: "Six months of data from the Pragyan rover reveal surprises about lunar geology",
    body: "<p>When Chandrayaan-3's Vikram lander touched down on the lunar south pole in August 2023, India became only the fourth country to achieve a soft lunar landing — and the first to do so near the pole. The Pragyan rover's 14-day surface mission has since yielded a trove of scientific data that planetary scientists are still unpacking.</p><p>The rover's Alpha Particle X-ray Spectrometer detected sulphur, aluminium, calcium, iron, chromium and titanium in the regolith — confirming the presence of elements that could theoretically support future in-situ resource utilisation. More intriguingly, a temperature gradient measurement at 10 cm depth was steeper than models predicted, hinting at possible ice segregation processes.</p><p>ISRO scientists presented preliminary findings at the Lunar and Planetary Science Conference in Houston in March 2024, to considerable international attention. A follow-on mission, Chandrayaan-4, targeting a sample return, is now in detailed design.</p>",
    category: "India",
    author: "Dr. Kavya Reddy",
    cover_image_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80",
    published_at: "2024-06-08T05:00:00Z",
  },
  {
    slug: "bollywood-ott-disruption",
    title: "Bollywood's Identity Crisis in the Age of OTT",
    subtitle: "As streaming platforms rewrite the rules, Hindi cinema scrambles to find its audience",
    body: "<p>The box-office performance of Hindi films in 2023 told two stories. Blockbusters like Jawan and Animal shattered records — Jawan grossed over ₹1,100 crore worldwide — while mid-budget dramas that would once have comfortably recovered their costs went straight to streaming after disappointing opening weekends.</p><p>The bifurcation mirrors a global trend but has particular resonance in India, where a booming regional cinema — especially from the south — has eroded Bollywood's cultural dominance. Telugu films like RRR and Pushpa 2 have demonstrated that dubbed content can command pan-India audiences that Hindi films once took for granted.</p><p>Directors like Zoya Akhtar and Reema Kagti argue that the upheaval is ultimately healthy. <strong>\"The audience has become more discerning,\"</strong> Akhtar told a packed session at the Mumbai Film Festival. <strong>\"Mediocrity no longer gets a pass just because a star attached to it.\"</strong></p>",
    category: "Entertainment",
    author: "Tanvi Mehta",
    cover_image_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80",
    published_at: "2024-07-22T11:00:00Z",
  },
  {
    slug: "india-climate-action-cop28",
    title: "India at COP28: Between Climate Ambition and Development Imperatives",
    subtitle: "New Delhi walks a tightrope as it commits to renewables while defending the right to grow",
    body: "<p>India arrived at COP28 in Dubai with a complicated brief. On one hand, its record on renewable energy deployment has been genuinely impressive: 180 GW of installed renewable capacity at the close of 2023, and a credible pathway to 500 GW by 2030. On the other, India remains the world's third-largest emitter of greenhouse gases and has resisted language that would mandate a hard deadline for phasing out coal.</p><p>Environment Minister Bhupender Yadav framed India's position with characteristic bluntness: <em>\"Those who industrialised on cheap coal for 200 years cannot now tell developing nations to bear the entire cost of the transition.\"</em> The remark drew applause in the negotiating hall and criticism from European delegations.</p><p>The eventual COP28 text — the first to call for \"transitioning away\" from fossil fuels — was a compromise that satisfied no one fully, which many veteran negotiators take as a sign that it was roughly fair.</p>",
    category: "World",
    author: "Sanjay Kapoor",
    cover_image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80",
    published_at: "2024-08-14T08:00:00Z",
  },
  {
    slug: "startup-funding-winter-india",
    title: "The Great Indian Startup Reckoning",
    subtitle: "After years of easy money, founders are learning to run lean — and many won't survive",
    body: "<p>The numbers are sobering. Indian startup funding fell from a record $35 billion in 2021 to roughly $8 billion in 2023, a decline of more than 75 percent. Layoffs at once-celebrated unicorns — from edtech to quick-commerce — have reshaped the employment landscape of major metros.</p><p>Yet a counter-narrative is emerging among investors who never bought into the growth-at-any-cost thesis. \"The companies that survive this correction will be genuinely durable businesses,\" says Karthik Reddy, managing partner at Blume Ventures. \"We're seeing healthier unit economics across the portfolio than we did in 2021.\"</p><p>The public markets offer a more nuanced picture. Zomato's stock, which touched ₹40 at its nadir in late 2022, recovered to ₹170 by mid-2024 as the company demonstrated consistent quarterly profits — proof, bulls argue, that the Indian internet consumer economy is real, if less hypergrowth than once imagined.</p>",
    category: "Business",
    author: "Arjun Malhotra",
    cover_image_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80",
    published_at: "2024-09-03T09:00:00Z",
  },
  {
    slug: "opinion-india-democracy-2024",
    title: "Opinion: The 2024 Election Result Was a Warning India Should Heed",
    subtitle: "The BJP's reduced majority signals voter fatigue with centralised power — and the opposition's chance",
    body: "<p>The results of the 2024 general election confounded almost every pre-poll survey. The Bharatiya Janata Party retained power but fell short of an outright majority for the first time since 2014, forced to rely on coalition partners whose demands have already complicated the Cabinet formation process.</p><p>The surprise was not the Congress Party's improved tally — widely anticipated — but the specific constituencies where the NDA haemorrhaged support: Faizabad (home to Ayodhya), Varanasi (where the Prime Minister's margin shrank dramatically) and several seats in Rajasthan and Haryana where farmers' and wrestlers' movements had mobilised against the government.</p><p>Democracies correct themselves through elections, and this one sent a clear message: economic discontent, particularly around unemployment and inflation, cuts through even the most powerful political brand. The opposition's challenge now is to convert a tactical victory into a coherent governing alternative before the next election cycle.</p>",
    category: "Opinion",
    author: "Editorial Board",
    cover_image_url: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80",
    published_at: "2024-10-17T06:00:00Z",
  },
  {
    slug: "india-fitness-wellness-boom",
    title: "From Yoga Mats to Marathons: India's Wellness Revolution",
    subtitle: "A fast-growing middle class is redefining health as aspiration, not just absence of illness",
    body: "<p>The queues outside CrossFit boxes in Gurugram at 6 AM, the sold-out bibs for the Tata Mumbai Marathon, the ₹5,000-crore market for protein supplements — these are data points in a striking cultural shift. Urban India is getting fit, and an entire industry is being built around the phenomenon.</p><p>Cult.fit, which operates fitness centres across 30 cities, counts over 3 million active members. The company's co-founder Mukesh Bansal attributes the surge partly to pandemic-era health anxiety and partly to social media. <em>\"Instagram turned fitness into a status symbol,\"</em> he says. <em>\"That's not the worst thing that's ever happened to public health.\"</em></p><p>The trend has a significant rural shadow, however. Non-communicable diseases — diabetes, hypertension, cardiac conditions — are rising fastest in Tier-2 and Tier-3 cities and in rural areas, where the wellness economy has barely penetrated and primary healthcare remains stretched.</p>",
    category: "Lifestyle",
    author: "Pooja Nair",
    cover_image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80",
    published_at: "2024-11-25T10:30:00Z",
  },
  {
    slug: "india-china-border-relations",
    title: "After the Disengagement: India and China's Uneasy Reset",
    subtitle: "Troops have stepped back from Depsang and Demchok — but trust remains elusive",
    body: "<p>The agreement reached in October 2024 to disengage troops from the last two friction points along the Line of Actual Control — Depsang Plains and Demchok — marked the formal end of the military standoff that began with the Galwan Valley clash in June 2020. Both sides declared the outcome a diplomatic success. Neither side convinced the other.</p><p>Indian strategic analysts note that the disengagement restores the status quo ante of April 2020 but does not resolve the underlying territorial dispute. <em>\"We have paused a crisis, not settled a conflict,\"</em> says former Ambassador Ashok Sajjanhar. Chinese state media, meanwhile, framed the agreement as evidence of Beijing's willingness to manage relations pragmatically.</p><p>Economic signals are mixed. Two-way trade, which continued even at the height of tensions, stands at over $100 billion — an asymmetry (heavily in China's favour) that New Delhi is eager to correct. Investment restrictions on Chinese firms remain in place.</p>",
    category: "Politics",
    author: "Col. (Retd.) Rahul Singh",
    cover_image_url: "https://images.unsplash.com/photo-1508433957232-3107f5fd5995?w=1200&q=80",
    published_at: "2024-12-10T07:30:00Z",
  },
];

export const seedDummyArticles = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ password: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const adminPw = process.env.ADMIN_PASSWORD;
    if (!adminPw || data.password !== adminPw) throw new Error("Invalid admin password");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, count } = await supabaseAdmin
      .from("articles")
      .upsert(DUMMY_ARTICLES, { onConflict: "slug", ignoreDuplicates: true, count: "exact" })
      .select("id");
    if (error) throw new Error(error.message);
    return { inserted: count ?? 0 };
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
