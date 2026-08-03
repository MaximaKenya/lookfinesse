import { FX_RATES } from "./fxRates";

/** Buyer display currencies — settle internally in KES. */
export const CHECKOUT_CURRENCIES = ["KES", "USD", "UGX", "TZS"] as const;
export type CheckoutCurrency = (typeof CHECKOUT_CURRENCIES)[number];

const STATIC_TO_KES: Record<string, number> = {
  KES: 1,
  USD: 129.5,
  UGX: 0.035, // ~1 UGX ≈ 0.035 KES
  TZS: 0.05, // ~1 TZS ≈ 0.05 KES
  EUR: 142.1,
  GBP: 166.3,
};

export function toKes(amount: number, from: string): number {
  if (from === "KES") return amount;
  const pair = `${from}_KES`;
  const rate = FX_RATES[pair] ?? STATIC_TO_KES[from];
  if (!rate) return amount;
  return Number((amount * rate).toFixed(2));
}

export function fromKes(amountKes: number, to: string): number {
  if (to === "KES") return amountKes;
  const pair = `KES_${to}`;
  const rate = FX_RATES[pair] ?? (STATIC_TO_KES[to] ? 1 / STATIC_TO_KES[to] : undefined);
  if (!rate) return amountKes;
  return Number((amountKes * rate).toFixed(2));
}

export function fxNote(from: CheckoutCurrency, to: CheckoutCurrency = "KES"): string {
  if (from === to) return "Prices shown in Kenyan Shillings (KES).";
  const sample = fromKes(1000, from);
  return `Indicative rate: 1,000 KES ≈ ${sample.toLocaleString()} ${from}. Settlement is in KES via M-Pesa/card. Rates update periodically and may differ at payment.`;
}
