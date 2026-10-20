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

  if (!isSupabaseConfigured()) return [];

  if (type === "following" && !userId) return [];

  let vendorIds: string[] | null = null;
  if (type === "following" && userId) {
    try {
      const { data: follows } = await supabase
        .from("follows")
        .select("vendor_id")
        .eq("follower_id", userId);
      vendorIds = follows?.map((f) => f.vendor_id) ?? [];
    } catch {
      return [];
    }
    if (!vendorIds.length) return [];
  }

  const data = await tryFeedPostsQuery((q) => {
    if (vendorIds) q = q.in("vendor_id", vendorIds);
    else if (type === "nearby") q = q.not("location", "is", null);
    else if (type === "live") q = q.eq("type", "live_session");
    else if (type !== "discover" && CATEGORY_MAP[type]) q = q.in("type", CATEGORY_MAP[type]);
    return q;
  }, limit);

  if (data === null || data.length === 0) return [];
  return attachFeedEngagement(data, userId);
}

/** Attach reaction_counts / comment_count / user_reaction in one batch (no N+1).
 * Uses the shared supabase client (not supabaseServer) so queries.ts stays
 * importable from client components.
 */
async function attachFeedEngagement<T extends { id: string }>(
  posts: T[],
  userId?: string
): Promise<(T & {
  reaction_counts: Partial<Record<string, number>>;
  reaction_count: number;
  comment_count: number;
  user_reaction: string | null;
})[]> {
  const empty = {
    reaction_counts: {} as Partial<Record<string, number>>,
    reaction_count: 0,
    comment_count: 0,
    user_reaction: null as string | null,
  };

  if (!posts.length) return posts.map((post) => ({ ...post, ...empty }));
  if (!isSupabaseConfigured()) {
    return posts.map((post) => ({ ...post, ...empty }));
  }

  const ids = posts.map((p) => p.id).filter((id) => id && !String(id).startsWith("demo-"));
  if (!ids.length) {
    return posts.map((post) => ({ ...post, ...empty }));
  }

  try {
    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabase.from("post_reactions").select("post_id, user_id, reaction_type").in("post_id", ids),
      supabase.from("post_comments").select("post_id").in("post_id", ids),
    ]);

    const byPost = new Map<string, typeof empty>();
    for (const id of ids) {
      byPost.set(id, {
        reaction_counts: {},
        reaction_count: 0,
        comment_count: 0,
        user_reaction: null,
      });
    }

    for (const row of reactions ?? []) {
      const entry = byPost.get(row.post_id as string);
      if (!entry) continue;
      const type = row.reaction_type as string;
      entry.reaction_counts[type] = (entry.reaction_counts[type] ?? 0) + 1;
      entry.reaction_count += 1;
      if (userId && row.user_id === userId) entry.user_reaction = type;
    }

    for (const row of comments ?? []) {
      const entry = byPost.get(row.post_id as string);
      if (entry) entry.comment_count += 1;
    }

    return posts.map((post) => ({ ...post, ...(byPost.get(post.id) ?? empty) }));
  } catch (err) {
    console.error("[attachFeedEngagement]", err);
    return posts.map((post) => ({ ...post, ...empty }));
  }
}

const REEL_SELECTS = [
  `*, vendors ( id, name, avatar_url, logo_url, is_verified ), products ( id, name, price, image_url ), services ( id, title, price )`,
  `*, vendors ( id, business_name, avatar_url, logo_url, is_verified ), products ( id, name, price, image_url ), services ( id, title, price )`,
  `*, vendors ( id, name, avatar_url ), products ( id, name, price )`,
  `*, vendors ( id, name ), products ( id, name, price )`,
  `*, products ( id, name, price )`,
  `*`,
];

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
  return row;
}

export function dedupeReels<T extends { id: string }>(reels: T[]): T[] {
  return Array.from(new Map(reels.map((reel) => [reel.id, reel])).values());
}

export async function getReels(limit = 25, userId?: string) {
  for (const select of REEL_SELECTS) {
    const { data, error } = await supabase
      .from("reels")
      .select(select)
      .order("engagement_score", { ascending: false })
      .limit(limit);
    if (!error) {
      if (!data || data.length === 0) return [];
      return attachReelEngagement(
        dedupeReels(data.map((row) => normalizeReelRow(row as Record<string, unknown>)!)),
        userId
      );
    }
    const msg = error.message?.toLowerCase() ?? "";
    if (!msg.includes("does not exist") && !msg.includes("column") && !msg.includes("relationship")) break;
  }
  return [];
}

async function attachReelEngagement<T extends { id: string }>(
  reels: T[],
  userId?: string
): Promise<(T & {
  reaction_counts: Partial<Record<string, number>>;
  reaction_count: number;
  comment_count: number;
  user_reaction: string | null;
})[]> {
  const empty = {
    reaction_counts: {} as Partial<Record<string, number>>,
    reaction_count: 0,
    comment_count: 0,
    user_reaction: null as string | null,
  };
  if (!reels.length) return reels.map((r) => ({ ...r, ...empty }));
  if (!isSupabaseConfigured()) {
    return reels.map((r) => ({ ...r, ...empty }));
  }
  const ids = reels.map((r) => r.id).filter((id) => id && !String(id).startsWith("demo-"));
  if (!ids.length) return reels.map((r) => ({ ...r, ...empty }));

  try {
    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabase.from("post_reactions").select("reel_id, user_id, reaction_type").in("reel_id", ids),
      supabase.from("post_comments").select("reel_id").in("reel_id", ids),
    ]);
    const byReel = new Map<string, typeof empty>();
    for (const id of ids) {
      byReel.set(id, {
        reaction_counts: {},
        reaction_count: 0,
        comment_count: 0,
        user_reaction: null,
      });
    }
    for (const row of reactions ?? []) {
      const entry = byReel.get(row.reel_id as string);
      if (!entry) continue;
      const type = row.reaction_type as string;
      entry.reaction_counts[type] = (entry.reaction_counts[type] ?? 0) + 1;
      entry.reaction_count += 1;
      if (userId && row.user_id === userId) entry.user_reaction = type;
    }
    for (const row of comments ?? []) {
      const entry = byReel.get(row.reel_id as string);
      if (entry) entry.comment_count += 1;
    }
    return reels.map((reel) => ({ ...reel, ...(byReel.get(reel.id) ?? empty) }));
  } catch (err) {
    console.error("[attachReelEngagement]", err);
    return reels.map((r) => ({ ...r, ...empty }));
  }
}

export async function getReelById(id: string) {
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
  if (!isSupabaseConfigured()) return [];

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
  if (sessions.length === 0) return [];
  return sessions;
}

export async function getLiveSessionById(id: string) {
  const { data } = await supabase
    .from("live_sessions")
    .select(`*, vendors ( id, name, avatar_url )`)
    .eq("id", id)
    .single();
  return data ?? null;
}

// Map short numeric ids (e.g. "1") to demo vendor UUIDs
function resolveDemoVendorId(id: string): string {
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

  const resolvedVendor = vendor ?? null;

  const { data: posts } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("vendor_id", resolvedId)
    .order("created_at", { ascending: false })
    .limit(20);

  const resolvedPosts = posts ?? [];

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
  if (!isSupabaseConfigured()) return [];

  const { data } = await supabase
    .from("creator_profiles")
    .select(`
      *,
      vendors ( id, business_name, name, avatar_url, category, is_verified )
    `)
    .order("subscriber_count", { ascending: false })
    .limit(limit);

  if (data && data.length > 0) return data;

  return [];
}

export async function getChallenges(limit = 6) {
  if (!isSupabaseConfigured()) return [];

  const { data } = await supabase
    .from("challenges")
    .select("*")
    .gte("end_date", new Date().toISOString())
    .order("participant_count", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getCategories(limit = 16) {
  if (!isSupabaseConfigured()) return [];

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(limit);

  return data ?? [];
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
