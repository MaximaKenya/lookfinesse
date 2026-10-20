import { processPaystackPayout } from "./paystackRail";

export async function processBankPayout(payout: {
  amount: number;
  account_number?: string;
  bank_code?: string;
  name?: string;
}) {
  return processPaystackPayout(payout);
}
