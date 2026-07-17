"use server";

// Every export here is a public HTTP endpoint once Next compiles it, exactly as
// the old createServerFn handlers were. The ADMIN_PASSWORD check must stay
// inside each mutating action — never hoist it to the caller.
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ARTICLE_CATEGORIES, slugify, type ArticleDoc } from "./articles";
import { getArticlesCollection } from "./articles.queries";

function assertAdmin(password: string) {
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!adminPw || password !== adminPw) {
    throw new Error("Invalid admin password");
  }
}

const createSchema = z.object({
  password: z.string().min(1).max(200),
  title: z.string().trim().min(3).max(200),
  subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  body: z.string().min(1).max(200_000),
  category: z.enum(ARTICLE_CATEGORIES),
  author: z.string().trim().min(1).max(100),
  cover_image_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});

export async function verifyAdminPassword(input: { password: string }) {
  const data = z.object({ password: z.string().min(1).max(200) }).parse(input);
  const adminPw = process.env.ADMIN_PASSWORD;
  return { ok: !!adminPw && data.password === adminPw };
}

export async function createArticle(input: z.input<typeof createSchema>) {
  const data = createSchema.parse(input);
  assertAdmin(data.password);

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

  revalidatePath("/");
  revalidatePath(`/article/${slug}`);
  return { slug };
}

export async function deleteArticle(input: { password: string; id: string }) {
  const data = z
    .object({ password: z.string().min(1).max(200), id: z.string().min(1).max(64) })
    .parse(input);
  assertAdmin(data.password);

  const { ObjectId } = await import("mongodb");
  let oid: InstanceType<typeof ObjectId>;
  try {
    oid = new ObjectId(data.id);
  } catch {
    throw new Error("Invalid article id");
  }

  const col = await getArticlesCollection();
  const doc = await col.findOne({ _id: oid }, { projection: { slug: 1 } });
  const res = await col.deleteOne({ _id: oid });
  if (res.deletedCount === 0) throw new Error("Article not found");

  revalidatePath("/");
  if (doc?.slug) revalidatePath(`/article/${doc.slug}`);
  return { ok: true };
}

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
    subtitle:
      "From Paris to Singapore, the Unified Payments Interface is rewriting cross-border money movement",
    body: "<p>Standing at a boulangerie near the Eiffel Tower and scanning a QR code with your Indian bank app to buy a croissant is no longer a hypothetical. Since France's BPCE group integrated UPI in mid-2023, Indian tourists have been able to pay in euros directly from their rupee accounts without dynamic currency conversion fees.</p><p>The National Payments Corporation of India (NPCI) has inked bilateral agreements with more than 10 countries, and the volume of cross-border UPI transactions grew 340 percent year-on-year in the first quarter of 2024. NPCI International CEO Ritesh Shukla calls it <strong>\"the democratisation of global payments\"</strong> — a system built on open standards, not proprietary rails controlled by a handful of card networks.</p><p>The geopolitical dimension is equally significant. Washington and Brussels have begun studying UPI's architecture as they search for alternatives to over-reliance on Visa and Mastercard in sensitive corridors.</p>",
    category: "Tech",
    author: "Ananya Krishnan",
    cover_image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
    published_at: "2024-03-05T07:00:00Z",
  },
  {
    slug: "india-2024-election-mandate",
    title: "The Verdict Is In: What India's 2024 Election Really Means",
    subtitle:
      "The BJP's reduced majority signals a shift in voter expectations — and opposition arithmetic",
    body: '<p>The results of India\'s 18th general election defied the confident predictions of most exit polls. The Bharatiya Janata Party retained power but fell short of a standalone majority in the Lok Sabha for the first time since 2014, winning 240 seats against the 272 needed. For a party that had governed with command majorities for a decade, the outcome demanded introspection.</p><p>The INDIA alliance — a fractious but ultimately durable coalition of opposition parties — emerged with 232 seats, far exceeding its own expectations. The Congress party nearly doubled its 2019 tally to 99 seats, signalling that reports of its political death had been exaggerated.</p><p>Analysts point to a convergence of factors: farmer distress in western Uttar Pradesh, unemployment among urban youth, and a backlash in constituencies where the opposition ran credible local candidates. <strong>"This election was a rebuke of complacency, not a rejection of governance,"</strong> said political scientist Suhas Palshikar. The coalition government that emerged faces the perennial test of durability under pressure.</p>',
    category: "Politics",
    author: "Vikram Nair",
    cover_image_url: "https://images.unsplash.com/photo-1585974738771-84483dd9f89f?w=1200&q=80",
    published_at: "2024-06-05T06:00:00Z",
  },
  {
    slug: "ipl-2024-kkr-champions",
    title: "KKR's Emphatic Title: How Kolkata Rewrote Their Own Story",
    subtitle: "A rebuild built on data, youth, and a coach who had something to prove",
    body: "<p>When Kolkata Knight Riders lifted the IPL trophy at the MA Chidambaram Stadium in Chennai, it felt like the culmination of a three-year project as much as a cricket match. The franchise that had parted ways with most of its star names after a dismal 2022 had systematically rebuilt around pace, power-hitting, and the vision of head coach Chandrakant Pandit.</p><p>Venkatesh Iyer's transformation from inconsistent opener to composed match-winner was the tournament's most compelling individual arc. The all-rounder scored 370 runs at a strike rate of 162, regularly absorbing early pressure before detonating in the back ten. <em>\"He's learned to play the situation, not just his game,\"</em> Pandit said after the final.</p><p>The bowling attack — led by Mitchell Starc, whose ₹24.75 crore price tag had raised eyebrows at the auction — proved its worth in knockout cricket, where the Australian's ability to dismiss openers inside the powerplay changed games. KKR's third IPL title validated a franchise philosophy that patience in rebuilding is as important as star power.</p>",
    category: "Sports",
    author: "Priya Menon",
    cover_image_url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&q=80",
    published_at: "2024-05-26T20:00:00Z",
  },
  {
    slug: "chandrayaan-3-one-year-later",
    title: "One Year After Chandrayaan-3: India's Moon Mission and What Comes Next",
    subtitle: "Pragyan may have gone silent, but the mission's data is still yielding discoveries",
    body: "<p>It has been a year since Vikram lander touched down near the lunar south pole — the first spacecraft in history to do so — and the scientific community is still parsing what the six-wheeled Pragyan rover found in those fourteen Earth days of operation. Spectroscopic data confirmed the presence of sulphur, iron, oxygen, and several other elements in the regolith, with sulphur's abundance proving particularly surprising to planetary scientists.</p><p>ISRO chairman S. Somanath has confirmed that Chandrayaan-4 — a sample-return mission — is in advanced planning, with a target launch window in 2028. The agency is simultaneously developing the LUPEX rover in collaboration with JAXA of Japan, which will drill up to two metres into the lunar surface in search of water ice.</p><p><strong>The broader significance of Chandrayaan-3 extends beyond science.</strong> India's cost of roughly $75 million — a fraction of comparable missions by NASA and ESA — has prompted genuine interest from space agencies in the Global South about ISRO as a technical partner rather than merely a launch provider. That reputational dividend may prove more lasting than any single discovery.</p>",
    category: "Tech",
    author: "Kavya Reddy",
    cover_image_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80",
    published_at: "2024-08-23T09:00:00Z",
  },
  {
    slug: "india-startup-funding-winter-thaw",
    title: "India's Startup Funding Winter Is Thawing — But Selectively",
    subtitle:
      "After two years of compressed valuations and layoffs, capital is returning — to profitable businesses only",
    body: '<p>The numbers tell a cautious story. Indian startup funding rose 35 percent in the first half of 2024 compared to the same period in 2023, according to data from Tracxn. But the headline figure conceals a more significant shift: the distribution of that capital has fundamentally changed. Gone are the days of pre-revenue companies raising Series B rounds on the strength of a pitch deck and a growth chart.</p><p>Investors — chastened by the public-market performance of Paytm, Nykaa and Delhivery after their IPOs — are demanding proof of unit economics before writing cheques. "We ask three questions now: are you profitable at the transaction level, what is your customer acquisition cost, and what is your 24-month payback period," said a partner at a leading Mumbai-based fund. "If you can\'t answer all three, the meeting is short."</p><p>The sectors drawing the most interest are B2B SaaS, deep-tech (particularly AI and defence), and climate technology — areas where India\'s engineering talent pool gives founders a structural advantage. Consumer internet, once the darling of the ecosystem, remains in the cold until the IPO pipeline clears.</p>',
    category: "Business",
    author: "Arjun Kapoor",
    cover_image_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80",
    published_at: "2024-07-10T08:30:00Z",
  },
  {
    slug: "rohit-sharma-test-retirement-analysis",
    title: "Rohit's Test Retirement: End of an Era, or Just a Chapter?",
    subtitle:
      "The captain walked away on his own terms — but Indian cricket's transition at the top has only just begun",
    body: "<p>Rohit Sharma's decision to retire from Test cricket, announced quietly via a social media post on a Tuesday morning, carried the hallmark of the man: understated, considered, and slightly ahead of the moment everyone expected. At 37, with 67 Tests and 12 centuries behind him, he chose to leave while still capable of contributing, rather than wait for selection to make the decision for him.</p><p>His legacy in the longest format is a complicated one to assess. The opening gambit that transformed him into a genuine Test force — moving him to open the batting in 2019 — came late in a career that had been defined by white-ball brilliance. Once the switch was made, however, he repaid the faith with an average above 45 as an opener, a figure that flatters the conditions in which it was compiled but speaks to a genuine technical recalibration.</p><p>The succession question is now pressing. Shubman Gill is the presumptive heir — young, technically orthodox, and already carrying the expectations of a nation. Whether he can shoulder that weight over the gruelling schedule that follows will define Indian cricket's next half-decade.</p>",
    category: "Sports",
    author: "Deepak Shenoy",
    cover_image_url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80",
    published_at: "2024-09-15T07:00:00Z",
  },
  {
    slug: "india-ai-policy-2024",
    title: "India Bets on AI: Can Regulation Keep Pace With Ambition?",
    subtitle:
      "The government's digital public infrastructure model may be the world's most ambitious AI deployment — if governance catches up",
    body: '<p>India\'s approach to artificial intelligence is characteristically bold and characteristically complex. The IndiaAI Mission, backed by a ₹10,372 crore outlay over five years, aims to build sovereign compute infrastructure, create indigenous large language models trained on Indian languages, and deploy AI tools across agriculture, health, and education at a scale no other country has attempted.</p><p>The compute pillar alone — 10,000 GPUs to be made available to startups and researchers at subsidised rates — has generated genuine excitement in the technology community. "Access to compute was the bottleneck. If the government fixes that, the next GPT-scale model might well come from Bengaluru or Hyderabad," said one AI researcher at IIT Delhi.</p><p>But critics point to a governance gap. India has no dedicated AI law, no independent AI regulator, and an evolving data protection framework that is still being operationalised. The tension between speed of deployment and adequacy of oversight is not unique to India — but the scale of ambition here makes the stakes unusually high.</p>',
    category: "Tech",
    author: "Sanjana Rao",
    cover_image_url: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80",
    published_at: "2024-04-18T10:00:00Z",
  },
  {
    slug: "mumbai-real-estate-boom-2024",
    title: "Mumbai's Property Market Defies Gravity — Again",
    subtitle:
      "Record registrations, rising ticket sizes and a new buyer profile are rewriting the city's real-estate story",
    body: "<p>Mumbai registered over 12,000 property transactions in a single month in March 2024 — the highest monthly figure in fourteen years, according to the Inspector General of Registration. The numbers were remarkable not just for their volume but for what they revealed about who is buying and what they are buying.</p><p>The sub-₹50 lakh segment, once the engine of Mumbai's housing market, has shrunk to under 20 percent of transactions. In its place, the ₹1–3 crore mid-segment and the above-₹5 crore luxury tier are driving volumes. Real-estate consultancy Anarock attributes the shift to a combination of rising incomes among the professional class, the persistent work-from-home tailwind pushing families toward larger homes, and the simple fact that a decade of stagnant prices finally convinced fence-sitters to act.</p><p>Developers are responding with supply that matches the new demand profile. Sea-view towers in Worli and Lower Parel that would have moved slowly five years ago are selling out in weeks. The question that analysts are beginning to ask is whether affordability — already stretched — will become a binding constraint on the next leg of the rally.</p>",
    category: "Business",
    author: "Nisha Patel",
    cover_image_url: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&q=80",
    published_at: "2024-04-02T08:00:00Z",
  },
  {
    slug: "india-bangladesh-relations-2024",
    title: "New Delhi and Dhaka: A Partnership Under Stress",
    subtitle:
      "The political transition in Bangladesh has forced India to rethink a relationship it had taken for granted",
    body: "<p>For much of the past fifteen years, India–Bangladesh relations were a model of South Asian bilateral cooperation: steady trade growth, infrastructure connectivity projects, shared water management, and a shared understanding on security. That comfort is now being tested.</p><p>The departure of Prime Minister Sheikh Hasina in August 2024 and the installation of an interim government led by Nobel laureate Muhammad Yunus introduced a new variable into New Delhi's calculations. Yunus has been careful in his public statements about India, but several figures in his administration have expressed views on the Citizenship Amendment Act, the National Register of Citizens, and the treatment of Hindu minorities in India that have created diplomatic friction.</p><p>India's strategic concern is simpler: Bangladesh sits astride critical trade and transit routes to the northeast, and any instability or tilt toward China or Pakistan would carry direct security implications. New Delhi is watching, and recalibrating.</p>",
    category: "World",
    author: "Suresh Krishnamurthy",
    cover_image_url: "https://images.unsplash.com/photo-1519219788971-8d9797e0928e?w=1200&q=80",
    published_at: "2024-09-01T09:30:00Z",
  },
];

export async function seedDummyArticles(input: { password: string }) {
  const data = z.object({ password: z.string().min(1).max(200) }).parse(input);
  assertAdmin(data.password);

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

  revalidatePath("/");
  return { inserted };
}
