import { TrustTier } from "@/lib/risk/trustTierEngine";

export function getPayoutDelay(tier: TrustTier) {
  switch (tier) {
    case "VIP":
      return 0;

    case "STANDARD":
      return 60 * 60 * 1000; // 1 hour

    case "WATCHLIST":
      return 24 * 60 * 60 * 1000; // 24h

    case "FROZEN":
      return Infinity;

    default:
      return 60 * 60 * 1000;
  }
}