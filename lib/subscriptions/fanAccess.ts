import type { SupabaseClient } from "@supabase/supabase-js";
import { fanMeetsRequired } from "./fanEntitlements";

/** Active fan tier slug for a user on a creator (membership_tiers.name → supporter|insider|vip). */
export async function getUserFanTierForVendor(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  vendorId: string
): Promise<string | null> {
  if (!userId) return null;

  const { data } = await supabase
    .from("memberships")
    .select("status, membership_tiers ( name )")
    .eq("user_id", userId)
    .eq("vendor_id", vendorId)
    .eq("status", "active")
    .maybeSingle();

  const tierName = (data as { membership_tiers?: { name?: string } | null })
    ?.membership_tiers?.name;
  if (!tierName) return null;
  return tierName.toLowerCase().replace(/\s+/g, "");
}

export function canViewExclusivePost(
  userTier: string | null,
  requiredTier: string | null | undefined,
  isOwnVendor: boolean
): boolean {
  if (isOwnVendor) return true;
  return fanMeetsRequired(userTier, requiredTier ?? null);
}
