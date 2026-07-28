"use client";

import { useEffect, useState } from "react";

export default function FraudHeatmap() {
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/intelligence/fraud-heatmap");
        const data = await res.json();
        setMatrix(data.matrix ?? []);
        setEmpty(Boolean(data.empty));
      } catch (err) {
        console.error("Fraud heatmap load failed", err);
        setMatrix([]);
        setEmpty(true);
      } finally {
        setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 overflow-hidden">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">
            Fraud Activity Matrix
          </h2>
          <p className="text-zinc-400 mt-2">
            Anomaly concentration by day and hour from ledger risk scores
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-2xl text-red-400 text-xs font-semibold tracking-widest">
          LIVE SURVEILLANCE
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading fraud matrix…</p>
      ) : empty || matrix.length === 0 ? (
        <p className="text-zinc-500 text-sm py-12 text-center">
          No transaction risk data yet — matrix will populate as orders flow through the ledger.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-5 mb-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Low Risk
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              Medium Risk
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Critical Risk
            </div>
          </div>

          <div className="space-y-2 overflow-x-auto">
            {matrix.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-12 md:grid-cols-24 gap-1 min-w-[900px]"
              >
                {row.map((cell, index) => (
                  <div
                    key={index}
                    className="h-7 rounded-md transition-all duration-300 hover:scale-125 hover:z-10"
                    style={{
                      backgroundColor:
                        cell > 75
                          ? "rgb(239 68 68)"
                          : cell > 40
                            ? "rgb(234 179 8)"
                            : "rgb(34 197 94)",
                      opacity: Math.max(cell / 100, 0.25),
                      boxShadow:
                        cell > 75 ? "0 0 15px rgba(239,68,68,0.4)" : "none",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
