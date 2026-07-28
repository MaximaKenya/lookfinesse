import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServer } from "@/lib/supabaseServer";

export interface AdCampaign {
  id: string;
  vendor_id: string;
  product_id?: string | null;
  title: string;
  headline: string;
  description?: string | null;
  image_url: string;
  cta_text: string;
  cta_url: string;
  target_categories: string[];
  target_location?: string | null;
  daily_budget: number;
  bid_amount: number;
  start_at: string;
  end_at: string;
  status: string;
  total_impressions: number;
  total_clicks: number;
  /** Computed during ranking */
  relevance_score?: number;
}

const FREQ_CAP = 10;
const FREQ_WINDOW_MS = 86_400_000;

/**
 * Fetch and rank active ad campaigns for the hero carousel.
 *
 * Ranking formula (higher = better slot):
 *   score = bid_amount * 10
 *         + interest_match_bonus (100 per matched category)
 *         + recency_bonus (10 if started within 24h)
 *         - ctr_penalty (deduct if CTR < 0.5% to avoid irrelevant ads)
 *
 * Frequency cap: exclude campaigns the user/session saw ≥ 10x in last 24h.
 */
export async function getPersonalizedAds(
  options: {
    userId?: string | null;
    sessionId?: string | null;
    location?: string | null;
    limit?: number;
    supabase?: SupabaseClient;
  } = {}
): Promise<AdCampaign[]> {
  const { userId, sessionId, location, limit = 6 } = options;
  const supabase = options.supabase ?? (await createSupabaseServer());
  const now = new Date().toISOString();

  const { data: campaigns, error } = await supabase
    .from("ad_campaigns")
    .select(
      "id,vendor_id,product_id,title,headline,description,image_url,cta_text,cta_url,target_categories,target_location,daily_budget,bid_amount,start_at,end_at,status,total_impressions,total_clicks"
    )
    .in("status", ["live", "active"])
    .lte("start_at", now)
    .gte("end_at", now)
    .order("bid_amount", { ascending: false })
    .limit(50);

  if (error || !campaigns?.length) return [];

  let userCategories: string[] = [];
  if (userId) {
    const [interestsRes, prefsRes] = await Promise.allSettled([
      supabase
        .from("user_interests")
        .select("category")
        .eq("user_id", userId)
        .order("score", { ascending: false })
        .limit(10),
      supabase.from("user_profiles").select("preferences").eq("user_id", userId).maybeSingle(),
    ]);
    if (interestsRes.status === "fulfilled") {
      userCategories.push(...(interestsRes.value.data?.map((i) => i.category) ?? []));
    }
    if (prefsRes.status === "fulfilled") {
      const prefs = (prefsRes.value.data?.preferences as { interests?: string[] } | null) ?? {};
      if (Array.isArray(prefs.interests)) {
        userCategories.push(...prefs.interests);
      }
    }
    userCategories = Array.from(new Set(userCategories.map((c) => (c || "").toLowerCase()).filter(Boolean)));
  }

  const impressionCounts: Record<string, number> = {};
  if (userId || sessionId) {
    const since = new Date(Date.now() - FREQ_WINDOW_MS).toISOString();
    let freqQuery = supabase
      .from("ad_impressions")
      .select("campaign_id")
      .gte("created_at", since)
      .limit(500);

    if (userId) {
      freqQuery = freqQuery.eq("user_id", userId);
    } else if (sessionId) {
      freqQuery = freqQuery.eq("session_id", sessionId);
    }

    const { data: recentImpressions } = await freqQuery;
    for (const imp of recentImpressions ?? []) {
      impressionCounts[imp.campaign_id] = (impressionCounts[imp.campaign_id] ?? 0) + 1;
    }
  }

  const scored = campaigns
    .filter((c) => {
      if ((impressionCounts[c.id] ?? 0) >= FREQ_CAP) return false;
      if (c.target_location && location) {
        return c.target_location.toLowerCase() === location.toLowerCase();
      }
      return true;
    })
    .map((c) => {
      let score = (c.bid_amount ?? 0) * 10;

      const targetCats: string[] = c.target_categories ?? [];
      for (const cat of targetCats) {
        if (userCategories.includes(cat)) score += 100;
      }

      const startedHoursAgo = (Date.now() - new Date(c.start_at).getTime()) / 3_600_000;
      if (startedHoursAgo < 24) score += 10;

      if (c.total_impressions > 500) {
        const ctr = c.total_clicks / c.total_impressions;
        if (ctr < 0.005) score -= 50;
      }

      return { ...c, relevance_score: score } as AdCampaign;
    });

  return scored
    .sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0))
    .slice(0, limit);
}
