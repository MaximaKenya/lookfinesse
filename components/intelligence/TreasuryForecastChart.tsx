"use client";

import { useEffect, useState } from "react";

export default function TreasuryForecastChart() {
  const [points, setPoints] = useState<number[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/intelligence/liquidity-forecast");
        const data = await res.json();
        setPoints(data.points || []);
        setConfidence(Number(data.confidence ?? 0));
        setEmpty(Boolean(data.empty));
      } catch {
        setPoints([]);
        setEmpty(true);
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const max = Math.max(...points, 1);
  const avg =
    points.length > 0
      ? Math.round(points.reduce((a, b) => a + b, 0) / points.length)
      : 0;

  const liquidityLabel = empty
    ? "No Data"
    : avg > 0
      ? "Active"
      : "Idle";

  const biasLabel =
    points.length >= 2 && points[points.length - 1] > points[0]
      ? "Bullish"
      : points.length >= 2 && points[points.length - 1] < points[0]
        ? "Bearish"
        : "Neutral";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 overflow-hidden">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">
            Treasury Forecast Engine
          </h2>
          <p className="text-zinc-400 mt-2">
            Daily credit inflow projection from ledger entries
          </p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-2xl text-green-400 text-xs font-semibold tracking-widest">
          14 DAY FORECAST
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="bg-black border border-zinc-800 rounded-2xl p-4">
          <div className="text-zinc-500 text-xs uppercase">Liquidity</div>
          <div className="text-2xl font-bold text-green-400 mt-3">
            {liquidityLabel}
          </div>
        </div>
        <div className="bg-black border border-zinc-800 rounded-2xl p-4">
          <div className="text-zinc-500 text-xs uppercase">Forecast Bias</div>
          <div className="text-2xl font-bold text-cyan-400 mt-3">{biasLabel}</div>
        </div>
        <div className="bg-black border border-zinc-800 rounded-2xl p-4">
          <div className="text-zinc-500 text-xs uppercase">Confidence</div>
          <div className="text-2xl font-bold text-yellow-400 mt-3">
            {confidence}%
          </div>
        </div>
        <div className="bg-black border border-zinc-800 rounded-2xl p-4">
          <div className="text-zinc-500 text-xs uppercase">Avg Daily Inflow</div>
          <div className="text-2xl font-bold text-red-400 mt-3">
            {empty ? "—" : `KES ${avg.toLocaleString()}`}
          </div>
        </div>
      </div>

      {empty ? (
        <p className="text-sm text-zinc-500 text-center py-16">
          No credit ledger entries yet — run seed.sql or process your first sale to see forecasts.
        </p>
      ) : (
        <div className="h-[420px]">
          <div className="h-full flex items-end gap-3">
            {points.map((point, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end h-full"
              >
                <div
                  className="rounded-t-[20px] bg-gradient-to-t from-green-700 via-green-500 to-green-300 hover:scale-y-105 transition-all duration-500 shadow-[0_0_40px_rgba(34,197,94,0.35)]"
                  style={{ height: `${(point / max) * 100}%` }}
                />
                <div className="text-center text-[10px] text-zinc-500 mt-3">
                  D{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
