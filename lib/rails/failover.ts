import { processPaystackPayout } from "./paystackRail";

export async function failoverPayout(payout: {
  amount: number;
  phone?: string;
  account_number?: string;
  bank_code?: string;
  name?: string;
}) {
  return processPaystackPayout(payout);
}
