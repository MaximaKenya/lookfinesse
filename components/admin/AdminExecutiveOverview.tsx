"use client";

import { useEffect, useState } from "react";

export default function AdminExecutiveOverview() {
  const [metrics, setMetrics] =
    useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        "/api/admin/control-center"
      );

      const data = await res.json();

      setMetrics(data.metrics);
    }

    load();

    const interval = setInterval(
      load,
      20000
    );

    return () =>
      clearInterval(interval);
  }, []);

  const cards = [
    {
      label: "Revenue Today",
      value: `KES ${Number(
        metrics?.revenueToday || 0
      ).toLocaleString()}`,
      color:
        "border-green-500/30 text-green-400",
    },

    {
      label: "Payout Volume",
      value: `KES ${Number(
        metrics?.payouts || 0
      ).toLocaleString()}`,
      color:
        "border-cyan-500/30 text-cyan-400",
    },

    {
      label: "Fraud Alerts",
      value:
        metrics?.suspiciousTransactions || 0,
      color:
        "border-red-500/30 text-red-400",
    },

    {
      label: "Liquidity Health",
      value: `${metrics?.liquidityRatio || 0}%`,
      color:
        "border-yellow-500/30 text-yellow-400",
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-zinc-900 border rounded-3xl p-6 ${card.color}`}
        >
          <div className="text-zinc-500 text-sm">
            {card.label}
          </div>

          <div
            className={`text-3xl font-bold mt-4 ${card.color.split(" ")[1]}`}
          >
            {card.value}
          </div>
        </div>
      ))}
    </section>
  );
}