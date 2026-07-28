"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getFinanceMetrics, FinanceMetrics } from "@/lib/finance/dashboard";
import CountUp from "react-countup";

export default function BalanceCards() {
  const [metrics, setMetrics] = useState<FinanceMetrics>({
    availableBalance: 0,
    escrowBalance: 0,
    pendingPayouts: 0,
    fraudAlerts: 0,
  });

  useEffect(() => {
    const load = async () => {
      const data = await getFinanceMetrics();
      setMetrics(data);
    };

    load();

    const channel = supabase
      .channel("finance-metrics")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ledger_entries" },
        load
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ledger_entries" },
        load
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "ledger_entries" },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cards = [
    {
      title: "Available Balance",
      value: metrics.availableBalance,
      type: "money",
      color: "text-green-400",
    },
    {
      title: "Escrow Balance",
      value: metrics.escrowBalance,
      type: "money",
      color: "text-green-400",
    },
    {
      title: "Pending Payouts",
      value: metrics.pendingPayouts,
      type: "money",
      color: "text-yellow-400",
    },
    {
      title: "Fraud Alerts",
      value: metrics.fraudAlerts,
      type: "risk",
      color: "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
        >
          <p className="text-gray-400 text-sm">{card.title}</p>

          <h2 className={`text-3xl font-bold mt-3 ${card.color}`}>
            {card.type === "money" ? (
              <>
                KES{" "}
                <CountUp
                  end={card.value}
                  duration={1.5}
                  separator=","
                />
              </>
            ) : (
              <CountUp end={card.value} duration={1.5} />
            )}
          </h2>
        </div>
      ))}
    </div>
  );
}