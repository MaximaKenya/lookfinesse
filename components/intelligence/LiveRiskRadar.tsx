"use client";

import { useEffect, useState } from "react";

interface RiskData {
  risk?: any;
  heatmap?: any[];
  insight?: string;
}

export default function LiveRiskRadar() {
  const [data, setData] =
    useState<RiskData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/intelligence/risk-radar"
      );

      // HANDLE BAD RESPONSES
      if (!res.ok) {
        const text = await res.text();

        console.error(
          "API ERROR:",
          text
        );

        throw new Error(
          `API failed with status ${res.status}`
        );
      }

      // SAFELY PARSE JSON
      const json = await res.json();

      setData(json);

      setError(null);
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load risk radar"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const interval = setInterval(
      load,
      30000
    );

    return () =>
      clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-5 border rounded-2xl bg-black text-white">
        Loading AI Risk Radar...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-red-500 rounded-2xl bg-black text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5 rounded-2xl border border-green-500 bg-black text-white">
      <div>
        <h2 className="text-xl font-bold text-green-400">
          LIVE RISK RADAR
        </h2>
      </div>

      <div>
        <p className="text-sm text-gray-400">
          AI Insight
        </p>

        <p className="mt-2">
          {data?.insight}
        </p>
      </div>

      <div>
        <p className="text-sm text-gray-400">
          Suspicious Transactions
        </p>

        <p className="text-2xl font-bold text-red-400">
          {
            data?.risk
              ?.suspiciousCount
          }
        </p>
      </div>

      <div>
        <p className="text-sm text-gray-400 mb-2">
          Heatmap Zones
        </p>

        <div className="space-y-2">
          {data?.heatmap?.map(
            (zone: any, i: number) => (
              <div
                key={i}
                className="flex justify-between border border-zinc-800 rounded-lg px-3 py-2"
              >
                <span>{zone.zone}</span>

                <span className="text-yellow-400">
                  {zone.intensity?.toFixed(
                    2
                  )}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}