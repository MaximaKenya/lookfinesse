import { supabase } from "@/lib/supabaseClient";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { FeedCategory } from "@/lib/types/social";

const CATEGORY_MAP: Record<string, string[]> = {
  fitness:  ["fitness", "workout", "transformation"],
  beauty:   ["beauty", "tutorial", "before_after"],
  style:    ["style_drop", "product", "transformation"],
  wellness: ["wellness", "tutorial"],
  live:     ["live_session"],
};

// ─── Demo fallbacks when DB is empty ────────────────────────────────────────

const DEMO_VENDORS: Record<string, { id: string; name: string; avatar_url: string }> = {
  v1: { id: "a1000000-0000-0000-0000-000000000001", name: "EliteFit Gym",        avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=EliteFit" },
  v2: { id: "a1000000-0000-0000-0000-000000000002", name: "Glow Salon & Spa",    avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=GlowSalon" },
  v3: { id: "a1000000-0000-0000-0000-000000000003", name: "Style Bank",          avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=StyleBank" },
  v4: { id: "a1000000-0000-0000-0000-000000000004", name: "Zen Wellness Centre", avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=ZenWellness" },
  v5: { id: "a1000000-0000-0000-0000-000000000005", name: "FitQueen Training",   avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=FitQueen" },
  v6: { id: "a1000000-0000-0000-0000-000000000006", name: "NaturalGlow Beauty",  avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=NaturalGlow" },
  v7: { id: "a1000000-0000-0000-0000-000000000007", name: "Afrocuts Barbershop", avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=Afrocuts" },
  v8: { id: "a1000000-0000-0000-0000-000000000008", name: "Lux Thread Studio",   avatar_url: "https://api.dicebear.com/7.x/initials/svg?seed=LuxThread" },
};

const DEMO_FEED_POSTS = [
  {
    id: "demo-fp1", vendor_id: DEMO_VENDORS.v3.id,
    type: "style_drop", feed_category: "style",
    caption: "New season Ankara is here 🔥 Shop the link in bio.",
    thumbnail_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    engagement_score: 92, hashtags: ["#AnkaraFashion", "#NairobiStyle"],
    vendors: DEMO_VENDORS.v3, products: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "demo-fp2", vendor_id: DEMO_VENDORS.v1.id,
    type: "transformation", feed_category: "fitness",
    caption: "6-week transformation done. No excuses, only results 💪",
    thumbnail_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
    engagement_score: 88, hashtags: ["#FitnessGoals", "#NairobiGym"],
    vendors: DEMO_VENDORS.v1, products: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "demo-fp3", vendor_id: DEMO_VENDORS.v2.id,
    type: "tutorial", feed_category: "beauty",
    caption: "Glass skin in 3 steps 🌟 Full routine breakdown — save this!",
    thumbnail_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800",
    engagement_score: 95, hashtags: ["#GlassSkin", "#SkincareRoutine"],
    vendors: DEMO_VENDORS.v2, products: null,
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "demo-fp4", vendor_id: DEMO_VENDORS.v5.id,
    type: "workout", feed_category: "fitness",
    caption: "20-min no-equipment morning routine. Do this before your coffee ☕",
    thumbnail_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    engagement_score: 78, hashtags: ["#MorningWorkout", "#HomeWorkout"],
    vendors: DEMO_VENDORS.v5, products: null,
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "demo-fp5", vendor_id: DEMO_VENDORS.v4.id,
    type: "tutorial", feed_category: "wellness",
    caption: "5 breathing exercises to reduce cortisol and improve focus 🧘",
    thumbnail_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    engagement_score: 70, hashtags: ["#Wellness", "#Breathwork"],
    vendors: DEMO_VENDORS.v4, products: null,
    created_at: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: "demo-fp6", vendor_id: DEMO_VENDORS.v2.id,
    type: "product", feed_category: "beauty",
    caption: "Korean Glass Skin Kit is BACK in stock 🇰🇷 Sold out twice already!",
    thumbnail_url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800",
    engagement_score: 88, hashtags: ["#KoreanSkincare", "#GlowUpNairobi"],
    vendors: DEMO_VENDORS.v2, products: null,
    created_at: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: "demo-fp7", vendor_id: DEMO_VENDORS.v6.id,
    type: "before_after", feed_category: "beauty",
    caption: "30 days of consistent skincare 🌿 The black seed oil REALLY works.",
    thumbnail_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800",
    engagement_score: 85, hashtags: ["#NaturalBeauty", "#BeforeAfter"],
    vendors: DEMO_VENDORS.v6, products: null,
    created_at: new Date(Date.now() - 25200000).toISOString(),
  },
  {
    id: "demo-fp8", vendor_id: DEMO_VENDORS.v1.id,
    type: "workout", feed_category: "fitness",
    caption: "Saturday 7AM bootcamp is BACK 🌅 45 spots only. Reserve now!",
    thumbnail_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
    engagement_score: 91, hashtags: ["#BootCamp", "#Westlands"],
    vendors: DEMO_VENDORS.v1, products: null,
    created_at: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: "demo-fp9", vendor_id: DEMO_VENDORS.v3.id,
    type: "style_drop", feed_category: "style",
    caption: "The Nairobi Suit collection is here 🕴️ Bespoke, ready in 14 days.",
    thumbnail_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    engagement_score: 82, hashtags: ["#BespokeSuits", "#AfricanMensFashion"],
    vendors: DEMO_VENDORS.v8, products: null,
    created_at: new Date(Date.now() - 32400000).toISOString(),
  },
  {
    id: "demo-fp10", vendor_id: DEMO_VENDORS.v4.id,
    type: "tutorial", feed_category: "wellness",
    caption: "Morning yoga sequence for office workers 🧘 5 poses, 10 minutes.",
    thumbnail_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    engagement_score: 67, hashtags: ["#OfficeYoga", "#WellnessNairobi"],
    vendors: DEMO_VENDORS.v4, products: null,
    created_at: new Date(Date.now() - 36000000).toISOString(),
  },
];

/** Filter demo feed posts by category */
function filterDemoPosts(posts: typeof DEMO_FEED_POSTS, type: string) {
  if (type === "discover" || type === "nearby") return posts;
  if (type === "following") return posts.slice(0, 4);
  const types = CATEGORY_MAP[type];
  if (!types) return posts;
  const filtered = posts.filter((p) => types.includes(p.type));
  return filtered.length > 0 ? filtered : posts;
}

export const DEMO_REELS = [
  {
    id: "demo-r1", vendor_id: DEMO_VENDORS.v1.id,
    caption: "Saturday morning HIIT session 🔥 Spots are limited, DM to book.",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
    engagement_score: 9420, vendors: DEMO_VENDORS.v1,
    products: { id: "demo-p3", name: "Performance Gym Bag — Black", price: 3200 },
    services: { id: "demo-s1", title: "HIIT Bootcamp — 60 mins", price: 1500 },
  },
  {
    id: "demo-r2", vendor_id: DEMO_VENDORS.v2.id,
    caption: "GRWM: Full glam in 10 minutes 💄",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600",
    engagement_score: 7800, vendors: DEMO_VENDORS.v2,
    products: { id: "demo-p8", name: "Korean Glass Skin Kit", price: 5800 },
    services: { id: "demo-s2", title: "Signature Facial Treatment", price: 3500 },
  },
  {
    id: "demo-r3", vendor_id: DEMO_VENDORS.v3.id,
    caption: "Nairobi rooftop photoshoot BTS 📸",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    engagement_score: 12100, vendors: DEMO_VENDORS.v3,
    products: { id: "demo-p1", name: "Ankara Blazer — Desert Gold", price: 4500 },
    services: null,
  },
  {
    id: "demo-r4", vendor_id: DEMO_VENDORS.v5.id,
    caption: "30-day abs challenge day 1 💪",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600",
    engagement_score: 8650, vendors: DEMO_VENDORS.v5,
    products: null,
    services: { id: "demo-s3", title: "Online PT Session — 45 mins", price: 2500 },
  },
  {
    id: "demo-r5", vendor_id: DEMO_VENDORS.v6.id,
    caption: "3-step nighttime skincare routine ✨",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnail_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600",
    engagement_score: 6400, vendors: DEMO_VENDORS.v6,
    products: { id: "demo-p5", name: "Shea & Argan Hair Butter", price: 1200 },
    services: null,
  },
];

const REEL_SELECTS = [
  `*, vendors ( id, name, avatar_url, logo_url, is_verified ), products ( id, name, price, image_url ), services ( id, title, price )`,
  `*, vendors ( id, business_name, avatar_url, logo_url, is_verified ), products ( id, name, price, image_url ), services ( id, title, price )`,
  `*, vendors ( id, name, avatar_url ), products ( id, name, price )`,
  `*, vendors ( id, name ), products ( id, name, price )`,
  `*, products ( id, name, price )`,
  `*`,
];

const DEFAULT_REEL_VIDEO =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export function normalizeReelRow(row: Record<string, unknown> | null) {
  if (!row) return row;
  const vendors = row.vendors as Record<string, unknown> | null | undefined;
  if (vendors) {
    if (!vendors.name && vendors.business_name) {
      vendors.name = vendors.business_name;
    }
    if (!vendors.avatar_url && vendors.logo_url) {
      vendors.avatar_url = vendors.logo_url;
    }
    if (vendors.is_verified !== undefined && vendors.verified === undefined) {
      vendors.verified = vendors.is_verified;
    }
  }
  if (!row.video_url) {
    row.video_url = DEFAULT_REEL_VIDEO;
  }
  return row;
}

export function dedupeReels<T extends { id: string }>(reels: T[]): T[] {
  return Array.from(new Map(reels.map((reel) => [reel.id, reel])).values());
}

const DEMO_SERVICES = [
  {
    id: "demo-s1", vendor_id: DEMO_VENDORS.v1.id,
    title: "HIIT Bootcamp — 60 mins", short_description: "High-intensity training for all levels.",
    price: 1500, category: "fitness", duration_minutes: 60,
    cover_image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
    bookings_count: 142, status: "active", is_virtual: false, is_in_person: true,
  },
  {
    id: "demo-s2", vendor_id: DEMO_VENDORS.v2.id,
    title: "Signature Facial Treatment", short_description: "Deep cleanse, exfoliation & hydration.",
    price: 3500, category: "beauty", duration_minutes: 75,
    cover_image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800",
    bookings_count: 98, status: "active", is_virtual: false, is_in_person: true,
  },
  {
    id: "demo-s3", vendor_id: DEMO_VENDORS.v5.id,
    title: "Online PT Session — 45 mins", short_description: "Personalised virtual workout with certified trainer.",
    price: 2500, category: "fitness", duration_minutes: 45,
    cover_image: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=800",
    bookings_count: 210, status: "active", is_virtual: true, is_in_person: false,
  },
  {
    id: "demo-s4", vendor_id: DEMO_VENDORS.v4.id,
    title: "Yoga & Breathwork — Morning", short_description: "Sunrise flow + pranayama for calm.",
    price: 1200, category: "wellness", duration_minutes: 60,
    cover_image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    bookings_count: 88, status: "active", is_virtual: false, is_in_person: true,
  },
  {
    id: "demo-s5", vendor_id: DEMO_VENDORS.v2.id,
    title: "Natural Hair Styling", short_description: "Braids, twists, locs & protective styles.",
    price: 4800, category: "beauty", duration_minutes: 180,
    cover_image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800",
    bookings_count: 76, status: "active", is_virtual: false, is_in_person: true,
  },
];

export const DEMO_LIVE_SESSIONS = [
  {
    id: "demo-l1", vendor_id: DEMO_VENDORS.v1.id,
    title: "Full Body HIIT — Live Burn",
    description: "45-min live HIIT workout. No equipment needed. All levels welcome!",
    scheduled_for: new Date(Date.now() + 3600000).toISOString(),
    is_live: true,
    cover_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200",
    viewer_count: 143,
    vendors: DEMO_VENDORS.v1,
  },
  {
    id: "demo-l2", vendor_id: DEMO_VENDORS.v5.id,
    title: "FitQueen Live: Booty & Core",
    description: "Live 45-min glutes & core session. Grab your mat!",
    scheduled_for: new Date(Date.now() + 7200000).toISOString(),
    is_live: true,
    cover_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200",
    viewer_count: 87,
    vendors: DEMO_VENDORS.v5,
  },
  {
    id: "demo-l3", vendor_id: DEMO_VENDORS.v2.id,
    title: "Skincare Masterclass: Know Your Skin",
    description: "Live Q&A + product demos. Learn your skin type and build your routine.",
    scheduled_for: new Date(Date.now() + 86400000).toISOString(),
    is_live: false,
    cover_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200",
    viewer_count: 0,
    vendors: DEMO_VENDORS.v2,
  },
];

// Demo products for shop fallback
export const DEMO_PRODUCTS = [
  { id: "demo-p1", name: "Ankara Blazer — Desert Gold",       price: 4500,  category: "fashion",     image_url: "https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=800", stock_quantity: 20, is_active: true, stores: { name: "Style Bank" } },
  { id: "demo-p2", name: "Vitamin C Brightening Serum",       price: 1800,  category: "beauty",      image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800", stock_quantity: 50, is_active: true, stores: { name: "Glow Salon" } },
  { id: "demo-p3", name: "Performance Gym Bag — Black",       price: 3200,  category: "fitness",     image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800", stock_quantity: 15, is_active: true, stores: { name: "EliteFit Gym" } },
  { id: "demo-p4", name: "Mindfulness Journal — LookFinesse Edition", price: 850,   category: "wellness",    image_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800", stock_quantity: 100, is_active: true, stores: { name: "Zen Wellness" } },
  { id: "demo-p5", name: "Shea & Argan Hair Butter",          price: 1200,  category: "beauty",      image_url: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800", stock_quantity: 80, is_active: true, stores: { name: "NaturalGlow Beauty" } },
  { id: "demo-p6", name: "Afrocuts Beard Oil — Cedarwood",    price: 1400,  category: "grooming",    image_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800", stock_quantity: 70, is_active: true, stores: { name: "Afrocuts" } },
  { id: "demo-p7", name: "Ankara Tote Bag — Limited",         price: 2800,  category: "accessories", image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800", stock_quantity: 25, is_active: true, stores: { name: "Style Bank" } },
  { id: "demo-p8", name: "Korean Glass Skin Kit",              price: 5800,  category: "beauty",      image_url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800", stock_quantity: 25, is_active: true, stores: { name: "Glow Salon" } },
  { id: "demo-p9", name: "Resistance Band Set (5 levels)",     price: 1600,  category: "fitness",     image_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800", stock_quantity: 60, is_active: true, stores: { name: "EliteFit Gym" } },
  { id: "demo-p10", name: "Organic Herbal Tea — Calm Blend",  price: 650,   category: "wellness",    image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800", stock_quantity: 80, is_active: true, stores: { name: "Zen Wellness" } },
  { id: "demo-p11", name: "FitQueen Sports Bra — Midnight",   price: 2400,  category: "fitness",     image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800", stock_quantity: 40, is_active: true, stores: { name: "FitQueen Training" } },
  { id: "demo-p12", name: "Bespoke Nairobi Suit — Charcoal",  price: 28000, category: "fashion",     image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800", stock_quantity: 5, is_active: true, stores: { name: "Lux Thread Studio" } },
  { id: "demo-p13", name: "High-Rise Straight Jeans — Indigo", price: 4200, category: "fashion",    image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", stock_quantity: 35, is_active: true, stores: { name: "Style Bank" } },
  { id: "demo-p14", name: "Wide-Leg Jeans — Stone Wash",       price: 5800, category: "women",      image_url: "https://images.unsplash.com/photo-1475178626629-edd718aabd6?w=800", stock_quantity: 22, is_active: true, stores: { name: "Lux Thread Studio" } },
];

// ─── Query functions ─────────────────────────────────────────────────────────

// Try a feed_posts query with progressively safer vendor-join shapes so we
// degrade gracefully when older databases are missing newer columns
// (e.g. `vendors.avatar_url` from migration 004).
async function tryFeedPostsQuery(
  applyFilters: (q: any) => any,
  limit: number
) {
  const SELECTS = [
    `*, vendors ( id, name, avatar_url, logo_url ), products ( id, name, price, image_url )`,
    `*, vendors ( id, business_name, avatar_url, logo_url ), products ( id, name, price, image_url )`,
    `*, vendors ( id, name, avatar_url ), products ( id, name, price, image_url )`,
    `*, vendors ( id, name ), products ( id, name, price, image_url )`,
    `*, vendors ( id, business_name ), products ( id, name, price, image_url )`,
    `*, products ( id, name, price, image_url )`,
    `*`,
  ];
  for (const select of SELECTS) {
    try {
      const query = applyFilters(
        supabase
          .from("feed_posts")
          .select(select)
          .order("created_at", { ascending: false })
          .limit(limit)
      );
      const { data, error } = await query;
      if (!error) {
        return data?.map((row: any) => {
          if (row.vendors) {
            if (!row.vendors.name && row.vendors.business_name) {
              row.vendors.name = row.vendors.business_name;
            }
            if (!row.vendors.avatar_url && row.vendors.logo_url) {
              row.vendors.avatar_url = row.vendors.logo_url;
            }
          }
          return row;
        }) ?? [];
      }
      const msg = error.message?.toLowerCase() ?? "";
      if (!msg.includes("does not exist") && !msg.includes("column") && !msg.includes("relationship")) {
        console.error("getFeedPosts:", error.message);
        return null;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export async function getFeedPosts(options: {
  type?: FeedCategory;
  userId?: string;
  limit?: number;
}) {
  const { type = "discover", userId, limit = 50 } = options;

  if (!isSupabaseConfigured()) {
    return filterDemoPosts(DEMO_FEED_POSTS, type);
  }

  if (type === "following" && !userId) {
    return filterDemoPosts(DEMO_FEED_POSTS, "following");
  }

  let vendorIds: string[] | null = null;
  if (type === "following" && userId) {
    try {
      const { data: follows } = await supabase
        .from("follows")
        .select("vendor_id")
        .eq("follower_id", userId);
      vendorIds = follows?.map((f) => f.vendor_id) ?? [];
    } catch {
      return filterDemoPosts(DEMO_FEED_POSTS, "following");
    }
    if (!vendorIds.length) return filterDemoPosts(DEMO_FEED_POSTS, "following");
  }

  const data = await tryFeedPostsQuery((q) => {
    if (vendorIds) q = q.in("vendor_id", vendorIds);
    else if (type === "nearby") q = q.not("location", "is", null);
    else if (type === "live") q = q.eq("type", "live_session");
    else if (type !== "discover" && CATEGORY_MAP[type]) q = q.in("type", CATEGORY_MAP[type]);
    return q;
  }, limit);

  if (data === null) return filterDemoPosts(DEMO_FEED_POSTS, type);
  if (data.length === 0) return filterDemoPosts(DEMO_FEED_POSTS, type);
  return data;
}

export async function getReels(limit = 25) {
  for (const select of REEL_SELECTS) {
    const { data, error } = await supabase
      .from("reels")
      .select(select)
      .order("engagement_score", { ascending: false })
      .limit(limit);
    if (!error) {
      if (!data || data.length === 0) return DEMO_REELS;
      return dedupeReels(data.map((row) => normalizeReelRow(row as Record<string, unknown>)!));
    }
    const msg = error.message?.toLowerCase() ?? "";
    if (!msg.includes("does not exist") && !msg.includes("column") && !msg.includes("relationship")) break;
  }
  return DEMO_REELS;
}

export async function getReelById(id: string) {
  if (id.startsWith("demo-")) {
    return DEMO_REELS.find((r) => r.id === id) ?? null;
  }
  for (const select of REEL_SELECTS) {
    const { data, error } = await supabase
      .from("reels")
      .select(select)
      .eq("id", id)
      .maybeSingle();
    if (!error) return data ? normalizeReelRow(data as Record<string, unknown>) : null;
    const msg = error.message?.toLowerCase() ?? "";
    if (!msg.includes("does not exist") && !msg.includes("column") && !msg.includes("relationship")) break;
  }
  return null;
}

export async function getFeedPostById(id: string) {
  if (id.startsWith("demo-")) {
    return DEMO_FEED_POSTS.find((p) => p.id === id) ?? null;
  }
  const SELECTS = [
    `*, vendors ( id, name, avatar_url ), products ( id, name, price, image_url )`,
    `*, vendors ( id, name ), products ( id, name, price, image_url )`,
    `*`,
  ];
  for (const select of SELECTS) {
    const { data, error } = await supabase
      .from("feed_posts")
      .select(select)
      .eq("id", id)
      .maybeSingle();
    if (!error) return data;
    const msg = error.message?.toLowerCase() ?? "";
    if (!msg.includes("does not exist") && !msg.includes("column") && !msg.includes("relationship")) break;
  }
  return null;
}

export async function getServices(category?: string) {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from("services")
    .select("*")
    .eq("status", "active")
    .order("bookings_count", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data } = await query.limit(50);
  return data ?? [];
}

export async function getServiceById(id: string) {
  if (id.startsWith("demo-")) {
    return null;
  }

  const { data } = await supabase
    .from("services")
    .select(`
      *,
      vendors ( id, name, avatar_url, location )
    `)
    .eq("id", id)
    .single();
  return data;
}

export async function getAvailabilitySlots(serviceId: string) {
  const { data } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("service_id", serviceId)
    .eq("is_booked", false)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(30);
  return data ?? [];
}

export async function getLiveSessions(upcomingOnly = true) {
  if (!isSupabaseConfigured()) return DEMO_LIVE_SESSIONS;

  let query = supabase
    .from("live_sessions")
    .select(`
      *,
      vendors ( id, name, avatar_url )
    `)
    .order("scheduled_for", { ascending: true });

  if (upcomingOnly) {
    query = query.gte("scheduled_for", new Date().toISOString());
  }

  const { data } = await query.limit(30);
  const sessions = data ?? [];
  if (sessions.length === 0) return DEMO_LIVE_SESSIONS;
  return sessions;
}

export async function getLiveSessionById(id: string) {
  // Return demo session for demo IDs
  if (id.startsWith("demo-")) {
    const demo = DEMO_LIVE_SESSIONS.find((s) => s.id === id);
    return demo ?? null;
  }

  const { data } = await supabase
    .from("live_sessions")
    .select(`*, vendors ( id, name, avatar_url )`)
    .eq("id", id)
    .single();
  return data ?? null;
}

// Map short numeric ids (e.g. "1") to demo vendor UUIDs
function resolveDemoVendorId(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return id;
  const idx = parseInt(id, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= 8) {
    const key = `v${idx}` as keyof typeof DEMO_VENDORS;
    return DEMO_VENDORS[key]?.id ?? id;
  }
  if (DEMO_VENDORS[id as keyof typeof DEMO_VENDORS]) {
    return DEMO_VENDORS[id as keyof typeof DEMO_VENDORS].id;
  }
  return id;
}

export async function getCreatorProfile(vendorId: string) {
  const resolvedId = resolveDemoVendorId(vendorId);

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("vendor_id", resolvedId)
    .maybeSingle();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", resolvedId)
    .maybeSingle();

  const resolvedVendor = vendor ?? (
    Object.values(DEMO_VENDORS).find((v) => v.id === resolvedId)
      ? {
          ...(Object.values(DEMO_VENDORS).find((v) => v.id === resolvedId)!),
          location: "Nairobi, Kenya",
          specialty: ["fitness", "wellness"],
        }
      : null
  );

  const { data: posts } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("vendor_id", resolvedId)
    .order("created_at", { ascending: false })
    .limit(20);

  const resolvedPosts =
    posts && posts.length > 0
      ? posts
      : DEMO_FEED_POSTS.filter((p) => p.vendor_id === resolvedId);

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", resolvedId);

  return {
    profile,
    vendor: resolvedVendor,
    posts: resolvedPosts,
    followerCount: followerCount ?? 0,
    resolvedId,
  };
}

export async function getTrendingTopics() {
  const { data } = await supabase
    .from("trending_topics")
    .select("*")
    .order("score", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getTrendingCreators(limit = 8) {
  if (!isSupabaseConfigured()) {
    return Object.values(DEMO_VENDORS).map((v, i) => ({
      vendor_id: v.id,
      subscriber_count: [3420, 2180, 5100, 890, 4250, 1340, 980, 2200][i] ?? 500,
      rating: 4.5 + (i % 5) * 0.1,
      verified: i % 2 === 0,
      vendors: { id: v.id, business_name: v.name, name: v.name, avatar_url: v.avatar_url, is_verified: i % 2 === 0 },
    }));
  }

  const { data } = await supabase
    .from("creator_profiles")
    .select(`
      *,
      vendors ( id, business_name, name, avatar_url, category, is_verified )
    `)
    .order("subscriber_count", { ascending: false })
    .limit(limit);

  if (data && data.length > 0) return data;

  return Object.values(DEMO_VENDORS).map((v, i) => ({
    vendor_id: v.id,
    subscriber_count: [3420, 2180, 5100, 890, 4250, 1340, 980, 2200][i] ?? 500,
    rating: 4.5 + (i % 5) * 0.1,
    verified: i % 2 === 0,
    vendors: { id: v.id, business_name: v.name, name: v.name, avatar_url: v.avatar_url, is_verified: i % 2 === 0 },
  }));
}

export async function getChallenges(limit = 6) {
  const demo = [
    { id: "demo-ch1", title: "30-Day Glow Challenge", category: "beauty", participant_count: 1240, cover_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800" },
    { id: "demo-ch2", title: "Nairobi Fit Week", category: "fitness", participant_count: 3560, cover_url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800" },
    { id: "demo-ch3", title: "Style Your Roots", category: "fashion", participant_count: 890, cover_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800" },
  ];
  if (!isSupabaseConfigured()) return demo;

  const { data } = await supabase
    .from("challenges")
    .select("*")
    .gte("end_date", new Date().toISOString())
    .order("participant_count", { ascending: false })
    .limit(limit);

  if (data && data.length > 0) return data;
  return demo;
}

export async function getCategories(limit = 16) {
  const demo = [
    { slug: "fashion", name: "Fashion", icon: "👗" },
    { slug: "beauty", name: "Beauty", icon: "💄" },
    { slug: "fitness", name: "Fitness", icon: "💪" },
    { slug: "wellness", name: "Wellness", icon: "🧘" },
    { slug: "men", name: "Men", icon: "👔" },
    { slug: "women", name: "Women", icon: "👩" },
    { slug: "kids", name: "Kids", icon: "👶" },
    { slug: "skincare", name: "Skincare", icon: "✨" },
  ];
  if (!isSupabaseConfigured()) return demo.slice(0, limit);

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(limit);

  if (data && data.length > 0) return data;
  return demo;
}

async function safeIlike<T = any>(
  table: string,
  cols: string,
  column: string,
  q: string,
  limit: number
): Promise<T[]> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(cols)
      .ilike(column, `%${q}%`)
      .limit(limit);
    if (error) return [];
    return (data ?? []) as T[];
  } catch {
    return [];
  }
}

export async function searchMarketplace(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return { products: [], services: [], creators: [], posts: [] };

  const [products, services, creators, posts] = await Promise.all([
    safeIlike("products", "id, name, price, image_url, stores(name)", "name", q, 12),
    safeIlike("services", "id, title, price, cover_image, category", "title", q, 12),
    safeIlike("vendors", "id, name, avatar_url, specialty", "name", q, 12),
    safeIlike("feed_posts", "id, caption, thumbnail_url, type", "caption", q, 12),
  ]);

  return { products, services, creators, posts };
}
