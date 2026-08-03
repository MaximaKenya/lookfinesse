"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Loader2, PackagePlus, Megaphone, Timer } from "lucide-react";
import { useVendorContext } from "@/hooks/useVendorContext";

type Signal = {
  signal_type: string;
  title: string;
  rationale: string;
  score: number;
  product_id?: string | null;
};

const ICONS: Record<string, typeof Flame> = {
  restock: PackagePlus,
  promote: Megaphone,
  drop: Flame,
  hold: Timer,
};

export default function DemandSignalsPanel() {
  const { vendorId } = useVendorContext();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }
    fetch(`/api/vendor/demand-signals?vendor_id=${vendorId}`)
      .then((r) => r.json())
      .then((d) => setSignals(d.signals ?? []))
      .finally(() => setLoading(false));
  }, [vendorId]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Smart restock & demand</h2>
          <p className="text-xs text-white/45 mt-0.5">
            Sales velocity + feed engagement → restock, promote, or drop this weekend.
          </p>
        </div>
        <Link href="/dashboard/create-drop" className="text-xs text-cyan-400 hover:underline">
          Schedule drop
        </Link>
      </div>

      {!vendorId ? (
        <p className="text-sm text-white/40">Vendor context needed.</p>
      ) : loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      ) : (
        <ul className="space-y-3">
          {signals.map((s, i) => {
            const Icon = ICONS[s.signal_type] ?? Flame;
            return (
              <li
                key={`${s.signal_type}-${i}`}
                className="flex gap-3 rounded-2xl border border-white/8 bg-black/20 p-3"
              >
                <div className="h-9 w-9 rounded-xl bg-fuchsia-500/15 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-fuchsia-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <p className="text-xs text-white/45 mt-0.5">{s.rationale}</p>
                  <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
                    {s.signal_type} · score {Math.round(s.score)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
