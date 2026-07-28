export type TrustTier =
  | "VIP"
  | "STANDARD"
  | "WATCHLIST"
  | "FROZEN";

export function determineTrustTier(
  risk_score: number,
  is_frozen: boolean
): TrustTier {
  if (is_frozen || risk_score >= 80) {
    return "FROZEN";
  }

  if (risk_score >= 50) {
    return "WATCHLIST";
  }

  if (risk_score <= 10) {
    return "VIP";
  }

  return "STANDARD";
}