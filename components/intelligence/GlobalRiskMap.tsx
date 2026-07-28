"use client";

import { useEffect, useState } from "react";

type Region = {
  region: string;
  risk: string;
  exposureLabel: string;
  color: string;
};

export default function GlobalRiskMap() {
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/intelligence/global-risk");
        const data = await res.json();
        setRegions(data.regions ?? []);
      } catch {
        setRegions([]);
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white">Global Risk Map</h2>
        <p className="text-zinc-400 mt-2">
          Geographic exposure from ledger geo_location fields
        </p>
      </div>

      {regions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No geo-tagged transactions yet — regional risk map will populate from ledger entries.
        </p>
      ) : (
        <div className="space-y-4">
          {regions.map((region) => (
            <div
              key={region.region}
              className="bg-black border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <div className="text-white text-lg font-bold">{region.region}</div>
                <div className="text-zinc-500 text-sm mt-1">
                  Exposure: {region.exposureLabel}
                </div>
              </div>
              <div className={`${region.color} font-bold`}>{region.risk}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
