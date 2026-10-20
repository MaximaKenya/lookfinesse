import { sendPaystackPayout } from "@/lib/paystack/payout";

export type PayoutProvider = "paystack";

export async function payoutProviderFactory(
  provider: PayoutProvider,
  payload: {
    amount: number;
    phone?: string;
    account_number?: string;
    bank_code?: string;
    name?: string;
  }
) {
  if (provider !== "paystack") {
    throw new Error("Only Paystack payouts are supported");
  }
  return sendPaystackPayout({
    amountKes: Number(payload.amount),
    phone: payload.phone,
    accountNumber: payload.account_number,
    bankCode: payload.bank_code,
    name: payload.name,
    reason: "LookFinesse vendor payout",
  });
}
