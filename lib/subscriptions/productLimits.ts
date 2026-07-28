import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlatformEntitlements } from "./platformEntitlements";
import { getVendorSubscriptionState } from "./vendorSubscription";

export type ProductLimitCheck = {
  allowed: boolean;
  current: number;
  max: number | null;
  tier: string;
  upgradeRequired: boolean;
};

export async function countVendorProducts(
  supabase: SupabaseClient,
  vendorId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .neq("status", "archived");

  if (error) {
    console.warn("countVendorProducts:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function checkVendorProductLimit(
  supabase: SupabaseClient,
  vendorId: string
): Promise<ProductLimitCheck> {
  const sub = await getVendorSubscriptionState(supabase, vendorId);
  const max = sub.entitlements.maxProducts;
  const current = await countVendorProducts(supabase, vendorId);
  const tier = sub.tier ?? "starter";

  if (max == null) {
    return { allowed: true, current, max: null, tier, upgradeRequired: false };
  }

  return {
    allowed: current < max,
    current,
    max,
    tier,
    upgradeRequired: current >= max,
  };
}

export function productLimitMessage(check: ProductLimitCheck): string {
  if (!check.upgradeRequired || check.max == null) return "";
  const next =
    check.tier === "starter"
      ? "Pro (50 products) or Elite (unlimited)"
      : "Elite (unlimited products)";
  return `You've reached your ${check.max}-product limit on ${check.tier}. Upgrade to ${next} to add more.`;
}

export function getProductLimitForTier(tier: string | null | undefined) {
  return getPlatformEntitlements(tier).maxProducts;
}
