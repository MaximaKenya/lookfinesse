import { sendPaystackPayout } from "@/lib/paystack/payout";

/** All payout rails settle through Paystack. */
export async function processPaystackPayout(payout: {
  amount: number;
  phone?: string;
  account_number?: string;
  bank_code?: string;
  name?: string;
}) {
  const result = await sendPaystackPayout({
    amountKes: Number(payout.amount),
    phone: payout.phone,
    accountNumber: payout.account_number,
    bankCode: payout.bank_code,
    name: payout.name,
  });
  return { success: true, rail: "paystack", reference: result.reference };
}
