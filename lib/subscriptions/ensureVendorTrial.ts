import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlatformEntitlements } from "./platformEntitlements";
import type { PlatformTierId } from "./platformTiers";

/** Default free-trial tier — full Pro entitlements for 30 days. */
export const DEFAULT_TRIAL_TIER: PlatformTierId = "pro";
export const TRIAL_DAYS = 30;

export type EnsureTrialResult = {
  created: boolean;
  vendorId: string | null;
  status: string;
  tier: string | null;
  current_period_end: string | null;
};

function periodEndIso(days = TRIAL_DAYS): string {
  const end = new Date();
  end.setDate(end.getDate() + days);
  return end.toISOString();
}

/**
 * Ensure the user has a vendors row (required by platform_subscriptions FK).
 * Creates a minimal vendor from store name / email when missing.
 */
export async function ensureVendorRow(
  supabase: SupabaseClient,
  userId: string,
  opts?: { businessName?: string; email?: string | null }
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("vendors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const businessName =
    opts?.businessName?.trim() ||
    store?.name?.trim() ||
    "My Store";

  const { data: inserted, error } = await supabase
    .from("vendors")
    .insert({
      user_id: userId,
      name: businessName,
      business_name: businessName,
      email: opts?.email ?? null,
      is_verified: false,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    console.warn("ensureVendorRow:", error?.message ?? "insert failed");
    return null;
  }

  // Link role so subsequent scope checks see vendor
  await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role: "vendor" }, { onConflict: "user_id,role" });

  return inserted.id as string;
}

/**
 * Create a 30-day Pro (or Elite) trial platform_subscription for new vendors.
 * Idempotent: does nothing when a subscription row already exists.
 */
export async function ensureVendorTrial(
  supabase: SupabaseClient,
  userId: string,
  opts?: {
    vendorId?: string;
    tier?: PlatformTierId;
    businessName?: string;
    email?: string | null;
  }
): Promise<EnsureTrialResult> {
  const tier = opts?.tier ?? DEFAULT_TRIAL_TIER;

  let vendorId = opts?.vendorId ?? null;

  // Validate provided vendorId actually exists in vendors
  if (vendorId) {
    const { data: v } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .maybeSingle();
    if (!v?.id) vendorId = null;
  }

  if (!vendorId) {
    vendorId = await ensureVendorRow(supabase, userId, {
      businessName: opts?.businessName,
      email: opts?.email,
    });
  }

  if (!vendorId) {
    return {
      created: false,
      vendorId: null,
      status: "none",
      tier: null,
      current_period_end: null,
    };
  }

  const { data: existing } = await supabase
    .from("platform_subscriptions")
    .select("id, status, tier, current_period_end")
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (existing?.id) {
    const periodOk =
      !existing.current_period_end ||
      new Date(existing.current_period_end) > new Date();
    const usable =
      (existing.status === "active" || existing.status === "trialing") &&
      periodOk;

    // Revive expired / cancelled / pending rows into a fresh Pro trial
    if (!usable) {
      const entitlements = getPlatformEntitlements(tier);
      const start = new Date().toISOString();
      const end = periodEndIso();
      const { error: reviveErr } = await supabase
        .from("platform_subscriptions")
        .update({
          user_id: userId,
          tier,
          status: "trialing",
          price_kes: 0,
          payment_method: null,
          ad_credits_remaining: entitlements.adCreditsMonthly,
          current_period_start: start,
          current_period_end: end,
          trial_ends_at: end,
          updated_at: start,
        })
        .eq("id", existing.id);

      if (!reviveErr) {
        return {
          created: true,
          vendorId,
          status: "trialing",
          tier,
          current_period_end: end,
        };
      }
      console.warn("ensureVendorTrial revive:", reviveErr.message);
    }

    return {
      created: false,
      vendorId,
      status: existing.status ?? "none",
      tier: existing.tier ?? null,
      current_period_end: existing.current_period_end ?? null,
    };
  }

  // Also skip if user already has a usable row keyed by user_id (legacy)
  const { data: byUser } = await supabase
    .from("platform_subscriptions")
    .select("id, status, tier, current_period_end, vendor_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUser?.id) {
    const periodOk =
      !byUser.current_period_end ||
      new Date(byUser.current_period_end) > new Date();
    const usable =
      (byUser.status === "active" || byUser.status === "trialing") && periodOk;

    if (!usable) {
      const entitlements = getPlatformEntitlements(tier);
      const start = new Date().toISOString();
      const end = periodEndIso();
      const { error: reviveErr } = await supabase
        .from("platform_subscriptions")
        .update({
          vendor_id: vendorId,
          tier,
          status: "trialing",
          price_kes: 0,
          payment_method: null,
          ad_credits_remaining: entitlements.adCreditsMonthly,
          current_period_start: start,
          current_period_end: end,
          trial_ends_at: end,
          updated_at: start,
        })
        .eq("id", byUser.id);

      if (!reviveErr) {
        return {
          created: true,
          vendorId,
          status: "trialing",
          tier,
          current_period_end: end,
        };
      }
    }

    return {
      created: false,
      vendorId: (byUser.vendor_id as string) ?? vendorId,
      status: byUser.status ?? "none",
      tier: byUser.tier ?? null,
      current_period_end: byUser.current_period_end ?? null,
    };
  }

  const entitlements = getPlatformEntitlements(tier);
  const start = new Date().toISOString();
  const end = periodEndIso();

  const { error } = await supabase.from("platform_subscriptions").insert({
    vendor_id: vendorId,
    user_id: userId,
    tier,
    status: "trialing",
    price_kes: 0,
    payment_method: null,
    ad_credits_remaining: entitlements.adCreditsMonthly,
    current_period_start: start,
    current_period_end: end,
    trial_ends_at: end,
    updated_at: start,
  });

  if (error) {
    console.warn("ensureVendorTrial insert:", error.message);
    return {
      created: false,
      vendorId,
      status: "none",
      tier: null,
      current_period_end: null,
    };
  }

  return {
    created: true,
    vendorId,
    status: "trialing",
    tier,
    current_period_end: end,
  };
}

/** Days remaining on a trial (ceil). Returns 0 when expired / not trialing. */
export function trialDaysRemaining(
  status: string | null | undefined,
  periodEnd: string | null | undefined
): number {
  if (status !== "trialing" || !periodEnd) return 0;
  const ms = new Date(periodEnd).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
