import { processPaystackPayout } from "./paystackRail";

export async function processCardPayout(payout: { amount: number; phone?: string; name?: string }) {
  return processPaystackPayout(payout);
}
