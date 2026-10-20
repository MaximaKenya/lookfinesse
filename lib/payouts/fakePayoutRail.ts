import { sendPaystackPayout } from "@/lib/paystack/payout";

export async function fakePayoutRail(payout: {
  amount: number;
  phone?: string;
  account_number?: string;
  bank_code?: string;
}) {
  await sendPaystackPayout({
    amountKes: Number(payout.amount),
    phone: payout.phone,
    accountNumber: payout.account_number,
    bankCode: payout.bank_code,
  });
  return true;
}
