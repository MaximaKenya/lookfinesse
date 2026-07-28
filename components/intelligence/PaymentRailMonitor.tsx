"use client";

import { useEffect, useState } from "react";

type Rail = {
  rail: string;
  status: string;
};

export default function PaymentRailMonitor() {
  const [rails, setRails] = useState<Rail[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/intelligence/payment-rails");
        const data = await res.json();
        setRails(data.rails ?? []);
      } catch {
        setRails([]);
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const colorFor = (status: string) => {
    if (status === "Healthy" || status === "Stable") return "text-green-400";
    if (status === "No Traffic") return "text-zinc-500";
    if (status.includes("Elevated")) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white">Payment Rail Monitor</h2>
        <p className="text-zinc-400 mt-2 text-sm">
          Status derived from recent ledger transaction outcomes
        </p>
      </div>

      {rails.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No payment rail activity in the last 24 hours.
        </p>
      ) : (
        <div className="space-y-4">
          {rails.map((rail) => (
            <div
              key={rail.rail}
              className="bg-black border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
            >
              <div className="text-white font-semibold">{rail.rail}</div>
              <div className={`${colorFor(rail.status)} font-bold`}>
                {rail.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
