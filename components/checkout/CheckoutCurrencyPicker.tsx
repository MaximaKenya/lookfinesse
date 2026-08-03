"use client";

import { useMemo, useState } from "react";
import {
  CHECKOUT_CURRENCIES,
  type CheckoutCurrency,
  fromKes,
  fxNote,
} from "@/lib/fx/currencies";

type Props = {
  totalKes: number;
  onCurrencyChange?: (c: CheckoutCurrency) => void;
};

export default function CheckoutCurrencyPicker({ totalKes, onCurrencyChange }: Props) {
  const [currency, setCurrency] = useState<CheckoutCurrency>("KES");

  const display = useMemo(() => fromKes(totalKes, currency), [totalKes, currency]);
  const note = useMemo(() => fxNote(currency), [currency]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-white/40">Display currency</p>
        <select
          value={currency}
          onChange={(e) => {
            const c = e.target.value as CheckoutCurrency;
            setCurrency(c);
            onCurrencyChange?.(c);
          }}
          className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
        >
          {CHECKOUT_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <p className="text-2xl font-bold text-white">
        {currency} {display.toLocaleString()}
      </p>
      <p className="text-xs text-white/45 leading-relaxed">{note}</p>
      {currency !== "KES" && (
        <p className="text-[11px] text-amber-200/80">
          You still pay in KES ({totalKes.toLocaleString()}) via M-Pesa or card. Diaspora cards settle in
          your card currency at your bank&apos;s FX.
        </p>
      )}
    </div>
  );
}
