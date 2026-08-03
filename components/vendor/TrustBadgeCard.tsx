"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { TRUST_TIER_LABELS, TRUST_TIER_UNLOCKS, type TrustTier } from "@/lib/trust/tiers";

export default function TrustBadgeCard({ vendorId }: { vendorId?: string | null }) {
  const [tier, setTier] = useState<TrustTier>("none");
  const [label, setLabel] = useState(TRUST_TIER_LABELS.none);
  const [unlocks, setUnlocks] = useState<string[]>(TRUST_TIER_UNLOCKS.none);

  useEffect(() => {
    if (!vendorId) return;
    fetch(`/api/vendor/trust-badge?vendor_id=${vendorId}`)
      .then((r) => r.json())
      .then((d) => {
        setTier((d.tier as TrustTier) || "none");
        setLabel(d.label || TRUST_TIER_LABELS.none);
        setUnlocks(d.unlocks || TRUST_TIER_UNLOCKS.none);
      })
      .catch(() => {});
  }, [vendorId]);

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {tier === "none" ? (
          <ShieldCheck className="h-5 w-5 text-white/40" />
        ) : (
          <BadgeCheck className="h-5 w-5 text-cyan-300" />
        )}
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/40">Trust tier · {tier}</p>
        </div>
      </div>
      <ul className="text-xs text-white/55 space-y-1">
        {unlocks.map((u) => (
          <li key={u}>• {u}</li>
        ))}
      </ul>
      <p className="text-[11px] text-white/35">
        Basic = ID verified (payouts + feed badge). Business = docs. Elite unlocks Elite ads & live holds.
      </p>
    </div>
  );
}
