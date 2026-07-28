"use client";

import { useEffect, useState } from "react";

export default function MarketplaceHealthScore() {
  const [score, setScore] = useState<number | null>(null);
  const [label, setLabel] = useState("Loading…");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/intelligence/marketplace-health");
        const data = await res.json();
        setScore(Number(data.score ?? 0));
        setLabel(data.label ?? "Unknown");
      } catch {
        setScore(0);
        setLabel("Data unavailable");
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const displayScore = score ?? 0;
  const tone =
    displayScore >= 80
      ? "text-green-400"
      : displayScore >= 50
        ? "text-yellow-400"
        : displayScore > 0
          ? "text-red-400"
          : "text-zinc-500";

  return (
    <div className="bg-gradient-to-br from-green-500/10 via-black to-zinc-900 border border-green-500/20 rounded-[32px] p-10 text-center overflow-hidden">
      <div className="text-zinc-400 uppercase tracking-[0.3em] text-xs">
        Marketplace Stability
      </div>

      <div className={`text-[120px] font-black leading-none mt-6 ${tone}`}>
        {displayScore}%
      </div>

      <div className="text-xl text-white font-semibold mt-6">{label}</div>

      {displayScore === 0 && (
        <p className="text-sm text-zinc-500 mt-4 max-w-md mx-auto">
          Run <code className="text-zinc-400">supabase/seed.sql</code> to populate
          ledger and order data for live health scoring.
        </p>
      )}
    </div>
  );
}
