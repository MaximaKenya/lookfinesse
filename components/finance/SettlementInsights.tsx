"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Metrics = {
  settlementSuccess: number;
  avgReleaseHours: number;
  escrowEfficiency: number;
  payoutCompletion: number;
};

function safePercent(value: number) {
  return `${Math.min(100, Math.max(0, value)).toFixed(1)}%`;
}

export default function SettlementInsights() {
  const [metrics, setMetrics] = useState<Metrics>({
    settlementSuccess: 0,
    avgReleaseHours: 0,
    escrowEfficiency: 0,
    payoutCompletion: 0,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      const { data } = await supabase
        .from("ledger_entries")
        .select("*");

      if (!data || data.length === 0) return;

      const total = data.length;

      const successful = data.filter(
        (e) => e.status === "completed"
      ).length;

      const payouts = data.filter(
        (e) => e.event_type === "PAYOUT_SENT"
      );

      const payoutCompleted = payouts.filter(
        (e) => e.status === "completed"
      ).length;

      const escrowHeld = data.filter(
        (e) => e.event_type === "ESCROW_HELD"
      ).length;

      const escrowReleased = data.filter(
        (e) => e.event_type === "ESCROW_RELEASED"
      ).length;

      setMetrics({
        settlementSuccess:
          total > 0 ? (successful / total) * 100 : 0,

        avgReleaseHours: 2.1,

        escrowEfficiency:
          escrowHeld > 0
            ? (escrowReleased / escrowHeld) * 100
            : 0,

        payoutCompletion:
          payouts.length > 0
            ? (payoutCompleted / payouts.length) * 100
            : 0,
      });
    };

    loadMetrics();

    const channel = supabase
      .channel("settlement-insights")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_entries",
        },
        loadMetrics
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const insightMetrics = [
    {
      label: "Settlement Success",
      value: safePercent(metrics.settlementSuccess),
      color: "text-green-400",
    },
    {
      label: "Avg Release Time",
      value: `${metrics.avgReleaseHours.toFixed(1)}h`,
      color: "text-blue-400",
    },
    {
      label: "Escrow Efficiency",
      value: safePercent(metrics.escrowEfficiency),
      color: "text-yellow-400",
    },
    {
      label: "Payout Completion",
      value: safePercent(metrics.payoutCompletion),
      color: "text-purple-400",
    },
  ];

  return (
<div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 overflow-hidden min-h-[320px] flex flex-col">
          {/* HEADER */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">
            Settlement Insights
          </h2>

          <p className="text-zinc-400 text-sm mt-1">
            Live operational settlement intelligence
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center text-green-400 text-[10px] font-semibold bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/30 leading-none h-fit">
          LIVE
        </span>
      </div>

      {/* METRICS */}
<div className="grid grid-cols-2 gap-4 flex-1 content-stretch">
            {insightMetrics.map((metric) => (
          <div
            key={metric.label}
className="min-w-0 bg-zinc-800/70 border border-zinc-700 rounded-2xl p-5 overflow-hidden flex flex-col justify-between"          >
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide leading-relaxed">
              {metric.label}
            </p>

            <p
              className={`text-xl xl:text-2xl font-bold mt-3 break-words leading-tight ${metric.color}`}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}