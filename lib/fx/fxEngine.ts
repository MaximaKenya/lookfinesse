import { FX_RATES } from "./fxRates";

export function convertCurrency(params: {
  amount: number;
  from: string;
  to: string;
}) {
  const { amount, from, to } = params;

  if (from === to) {
    return amount;
  }

  const pair = `${from}_${to}`;

  const rate = FX_RATES[pair];

  if (!rate) {
    throw new Error(
      `Unsupported FX pair: ${pair}`
    );
  }

  return Number((amount * rate).toFixed(2));
}