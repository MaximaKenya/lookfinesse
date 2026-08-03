export type TrustTier = "none" | "basic" | "business" | "elite";

export const TRUST_TIER_LABELS: Record<TrustTier, string> = {
  none: "Unverified",
  basic: "ID Verified",
  business: "Business Verified",
  elite: "Elite Verified",
};

export const TRUST_TIER_UNLOCKS: Record<TrustTier, string[]> = {
  none: ["Browse & list products"],
  basic: ["Payouts (M-Pesa)", "Verified badge on feed"],
  business: ["Higher payout limits", "Storefront trust badge", "Ads boost"],
  elite: ["Elite ads", "Priority support", "Live drops inventory holds"],
};

export function tierFromKycStatus(status?: string | null, hasBusinessDocs?: boolean): TrustTier {
  const s = (status ?? "").toLowerCase();
  if (s === "approved" || s === "verified") {
    return hasBusinessDocs ? "business" : "basic";
  }
  if (s === "elite") return "elite";
  return "none";
}
