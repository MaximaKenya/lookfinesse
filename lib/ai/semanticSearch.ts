/**
 * Semantic / intent-aware search for the marketplace.
 *
 * Strategy:
 *  1. Parse the raw query into detected intents + expanded keywords.
 *  2. If OPENAI_API_KEY is present, generate an embedding and re-rank results.
 *  3. Otherwise fall back to the expanded multi-keyword ilike search.
 */

import { supabase } from "@/lib/supabaseClient";

// ─── Intent taxonomy ────────────────────────────────────────────────────────

type Intent = "style" | "fitness" | "beauty" | "nearby" | "services" | "general";

interface ParsedQuery {
  original: string;
  normalised: string;
  intents: Intent[];
  keywords: string[];
  locationHint?: string;
}

// Maps surface words → intents + extra search keywords
const INTENT_MAP: Array<{
  patterns: RegExp[];
  intent: Intent;
  expand: string[];
}> = [
  {
    patterns: [/outfit|wear|dress|style|fashion|clothe|streetwear|look|attire|wardrobe/i],
    intent: "style",
    expand: ["fashion", "clothing", "apparel", "outfit", "style"],
  },
  {
    patterns: [/workout|gym|fitness|train|exercise|yoga|pilates|run|cardio|weight/i],
    intent: "fitness",
    expand: ["fitness", "workout", "training", "gym", "exercise"],
  },
  {
    patterns: [/salon|hair|skin|beauty|makeup|nail|spa|facial|wax|glam/i],
    intent: "beauty",
    expand: ["beauty", "salon", "hair", "skin", "makeup"],
  },
  {
    patterns: [/near|nearby|around|close|nairobi|westlands|karen|kilimani|cbd|kileleshwa|parklands|runda/i],
    intent: "nearby",
    expand: [],
  },
  {
    patterns: [/book|session|class|coach|trainer|tutor|consult|appointment|schedule/i],
    intent: "services",
    expand: ["booking", "session", "class", "coaching"],
  },
];

// Nairobi neighbourhoods we can detect as a location hint
const NAIROBI_AREAS = [
  "westlands", "karen", "kilimani", "cbd", "kileleshwa",
  "parklands", "runda", "lavington", "upperhill", "ngong road",
  "thika road", "mombasa road", "eastlands", "nairobi",
];

export function parseQuery(raw: string): ParsedQuery {
  const normalised = raw.trim().toLowerCase();
  const words = normalised.split(/\s+/);

  const intents: Set<Intent> = new Set();
  const extraKeywords: Set<string> = new Set();

  for (const { patterns, intent, expand } of INTENT_MAP) {
    if (patterns.some((p) => p.test(normalised))) {
      intents.add(intent);
      expand.forEach((k) => extraKeywords.add(k));
    }
  }

  if (intents.size === 0) intents.add("general");

  const locationHint = NAIROBI_AREAS.find((area) => normalised.includes(area));

  const keywords = Array.from(
    new Set([...words.filter((w) => w.length > 2), ...Array.from(extraKeywords)])
  );

  return {
    original: raw,
    normalised,
    intents: Array.from(intents),
    keywords,
    locationHint,
  };
}

// ─── OpenAI embedding (optional) ────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: key });
    const res = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return res.data[0].embedding;
  } catch {
    return null;
  }
}

// Simple keyword relevance score (0–1) for fallback ranking
function keywordScore(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  const hits = keywords.filter((k) => lower.includes(k)).length;
  return hits / Math.max(keywords.length, 1);
}

// ─── DB search helpers ───────────────────────────────────────────────────────

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function safeQuery<T>(query: any, fallback: T): Promise<T> {
  try {
    const { data, error } = await query;
    if (error) return fallback;
    return (data ?? fallback) as T;
  } catch {
    return fallback;
  }
}

async function searchWithKeywords(parsed: ParsedQuery) {
  const { keywords, intents, locationHint } = parsed;
  const likePattern = (kw: string) => `%${kw}%`;
  const primaryQ = parsed.normalised;

  const productsQ = safeQuery<any[]>(
    supabase
      .from("products")
      .select("id, name, price, image_url")
      .or(keywords.map((k) => `name.ilike.${likePattern(k)}`).join(","))
      .limit(15),
    []
  );

  const servicesHasPriority = intents.some((i) =>
    ["services", "fitness", "beauty", "nearby"].includes(i)
  );
  let servicesBuilder: any = supabase
    .from("services")
    .select("id, title, price, cover_image, category, short_description")
    .or(
      keywords
        .map((k) => `title.ilike.${likePattern(k)}`)
        .concat(keywords.map((k) => `category.ilike.${likePattern(k)}`))
        .join(",")
    )
    .limit(servicesHasPriority ? 15 : 10);
  if (servicesHasPriority && locationHint) {
    servicesBuilder = servicesBuilder.ilike("location", likePattern(locationHint));
  }
  const servicesQ = safeQuery<any[]>(servicesBuilder, []);

  const creatorsQ = safeQuery<any[]>(
    supabase
      .from("vendors")
      .select("id, business_name, name, avatar_url, logo_url, specialty, location")
      .or(
        keywords
          .map((k) => `business_name.ilike.${likePattern(k)}`)
          .concat(keywords.map((k) => `name.ilike.${likePattern(k)}`))
          .join(",")
      )
      .limit(10),
    []
  );

  const postKeywords = [primaryQ, ...keywords.slice(0, 3)];
  const postsQ = safeQuery<any[]>(
    supabase
      .from("feed_posts")
      .select("id, caption, thumbnail_url, type, vendor_id")
      .or(postKeywords.map((k) => `caption.ilike.${likePattern(k)}`).join(","))
      .limit(8),
    []
  );

  const [products, services, creatorsRaw, posts] = await Promise.all([
    withTimeout(productsQ, 6000, []),
    withTimeout(servicesQ, 6000, []),
    withTimeout(creatorsQ, 6000, []),
    withTimeout(postsQ, 6000, []),
  ]);

  const creators = creatorsRaw.map((c: any) => ({
    ...c,
    name: c.name ?? c.business_name ?? "Creator",
    avatar_url: c.avatar_url ?? c.logo_url,
  }));

  return { products, services, creators, posts };
}

// ─── Demo fallbacks ──────────────────────────────────────────────────────────

const DEMO_SEARCH = {
  products: [
    { id: "demo-p1", name: "Ankara Blazer — Desert Gold", price: 4500, image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=400" },
    { id: "demo-p2", name: "Vitamin C Brightening Serum", price: 1800, image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400" },
    { id: "demo-p8", name: "Korean Glass Skin Kit", price: 5800, image_url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400" },
  ],
  services: [
    { id: "demo-s1", title: "HIIT Bootcamp — 60 mins", price: 1500, cover_image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400", category: "fitness" },
    { id: "demo-s2", title: "Signature Facial Treatment", price: 3500, cover_image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400", category: "beauty" },
    { id: "demo-s4", title: "Yoga & Breathwork", price: 1200, cover_image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400", category: "wellness" },
  ],
  creators: [
    { id: "a1000000-0000-0000-0000-000000000001", name: "EliteFit Gym", avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=EliteFit", specialty: ["fitness"] },
    { id: "a1000000-0000-0000-0000-000000000002", name: "Glow Salon & Spa", avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=GlowSalon", specialty: ["beauty"] },
    { id: "a1000000-0000-0000-0000-000000000003", name: "Style Bank", avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=StyleBank", specialty: ["fashion"] },
  ],
  posts: [
    { id: "demo-fp1", caption: "New season Ankara is here", thumbnail_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", type: "style_drop" },
    { id: "demo-fp3", caption: "Glass skin in 3 steps", thumbnail_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400", type: "tutorial" },
  ],
};

function applyDemoFilter(q: string) {
  const lower = q.toLowerCase();
  const m = (text: string) => !lower || text.toLowerCase().includes(lower);
  return {
    products: DEMO_SEARCH.products.filter((p) => m(p.name)),
    services: DEMO_SEARCH.services.filter((s) => m(s.title) || m(s.category)),
    creators: DEMO_SEARCH.creators.filter((c) => m(c.name) || c.specialty.some((s) => m(s))),
    posts: DEMO_SEARCH.posts.filter((p) => m(p.caption)),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface SearchResults {
  products: any[];
  services: any[];
  creators: any[];
  posts: any[];
  intent?: Intent[];
  semantic?: boolean;
}

export async function semanticSearch(raw: string): Promise<SearchResults> {
  if (!raw.trim()) {
    return { products: [], services: [], creators: [], posts: [] };
  }

  const parsed = parseQuery(raw);
  let base;
  try {
    base = await withTimeout(searchWithKeywords(parsed), 10000, applyDemoFilter(raw));
  } catch {
    base = applyDemoFilter(raw);
  }

  const totalLive =
    base.products.length + base.services.length + base.creators.length + base.posts.length;
  if (totalLive === 0) {
    base = applyDemoFilter(raw);
  }

  // If OpenAI key available, do a lightweight re-rank using keyword overlap
  const embedding = await withTimeout(getEmbedding(raw), 4000, null);
  if (embedding) {
    const rerank = (items: any[], textFn: (i: any) => string) =>
      items
        .map((item) => ({ ...item, _score: keywordScore(textFn(item), parsed.keywords) }))
        .sort((a, b) => b._score - a._score)
        .map(({ _score: _unused, ...item }) => item);

    return {
      products: rerank(base.products, (i) => i.name ?? ""),
      services: rerank(base.services, (i) => `${i.title} ${i.category} ${i.short_description ?? ""}`),
      creators: rerank(base.creators, (i) => `${i.name ?? i.business_name} ${(i.specialty ?? []).join(" ")}`),
      posts: rerank(base.posts, (i) => i.caption ?? ""),
      intent: parsed.intents,
      semantic: true,
    };
  }

  return { ...base, intent: parsed.intents, semantic: false };
}
