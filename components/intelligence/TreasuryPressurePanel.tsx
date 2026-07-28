"use client";

import { useEffect, useState } from "react";

export default function TreasuryPressurePanel() {
  const [data, setData] =
    useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        "/api/intelligence/treasury-pressure"
      );

      const json = await res.json();

      setData(json);
    }

    load();
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        Treasury Pressure
      </h2>

      <div className="space-y-4">
        <div>
          <div className="text-zinc-500 text-sm">
            Pressure Severity
          </div>

          <div className="text-3xl font-bold text-yellow-400 mt-2">
            {data?.severity}
          </div>
        </div>

        <div className="w-full bg-zinc-800 h-5 rounded-full overflow-hidden">
          <div
            className="bg-yellow-500 h-full"
            style={{
              width: `${
                (data?.pressure || 0) *
                100
              }%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}