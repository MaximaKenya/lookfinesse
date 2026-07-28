import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPlatformEntitlements,
  type PlatformEntitlements,
} from "./platformEntitlements";

export type VendorSubscriptionState = {
  active: boolean;
  tier: string | null;
  status: string;
  entitlements: PlatformEntitlements;
  adCreditsRemaining: number;
  /** false when no platform_subscriptions row exists */
  hasRow: boolean;
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

function periodIsValid(end: string | null | undefined): boolean {
  if (!end) return true;
  return new Date(end) > new Date();
}

export async function getVendorSubscriptionState(
  supabase: SupabaseClient,
  vendorId: string
): Promise<VendorSubscriptionState> {
  const { data: sub } = await supabase
    .from("platform_subscriptions")
    .select("tier, status, current_period_end, ad_credits_remaining")
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (!sub) {
    return {
      active: false,
      tier: null,
      status: "none",
      entitlements: getPlatformEntitlements("starter"),
      adCreditsRemaining: getPlatformEntitlements("starter").adCreditsMonthly,
      hasRow: false,
    };
  }

  const active =
    ACTIVE_STATUSES.has(sub.status) && periodIsValid(sub.current_period_end);

  const tier = active ? (sub.tier ?? "starter") : sub.tier ?? null;

  return {
    active: !!active,
    tier,
    status: sub.status ?? "none",
    entitlements: getPlatformEntitlements(tier ?? "starter"),
    adCreditsRemaining: Number(
      sub.ad_credits_remaining ?? getPlatformEntitlements(tier ?? "starter").adCreditsMonthly
    ),
    hasRow: true,
  };
}

/** Count vendor feed posts in the current calendar month (UTC). */
export async function countVendorPostsThisMonth(
  supabase: SupabaseClient,
  vendorId: string
): Promise<number> {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("feed_posts")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .gte("created_at", start.toISOString());

  if (error) {
    console.warn("countVendorPostsThisMonth:", error.message);
    return 0;
  }
  return count ?? 0;
}
