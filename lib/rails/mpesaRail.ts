import { processPaystackPayout } from "./paystackRail";

export async function processMpesaPayout(payout: { amount: number; phone?: string; name?: string }) {
  return processPaystackPayout({ ...payout, phone: payout.phone });
}
