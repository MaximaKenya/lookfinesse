import { LedgerEntry } from "@/types/intelligence";

export function computeProductRisk(product: any) {
  let score = 0;

  if (product.refund_rate > 0.2) {
    score += 30;
  }

  if (product.price_spike) {
    score += 20;
  }

  if (product.velocity_spike) {
    score += 25;
  }

  if (product.chargebacks > 3) {
    score += 25;
  }

  return {
    score,
    risk:
      score > 70
        ? "HIGH"
        : score > 40
        ? "MEDIUM"
        : "LOW",
  };
}
