"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TreasuryMetrics = {
  incomingPayments: number;
  escrowHoldings: number;
  vendorPayouts: number;
  riskReserve: number;
};

function formatCompact(value: number) {
  if (value >= 1_000_000_000) {
    return `KES ${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `KES ${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `KES ${(value / 1_000).toFixed(1)}K`;
  }

  return `KES ${value.toLocaleString()}`;
}

export default function TreasuryFlowMap() {
  const [metrics, setMetrics] = useState<TreasuryMetrics>({
    incomingPayments: 0,
    escrowHoldings: 0,
    vendorPayouts: 0,
    riskReserve: 0,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      const { data } = await supabase.from("ledger_entries").select("*");

      if (!data) return;

      const incomingPayments = data
        .filter((e) => e.event_type === "PAYMENT_RECEIVED")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const escrowHoldings = data
        .filter(
          (e) => e.event_type === "ESCROW_HELD" && e.status !== "released",
        )
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const vendorPayouts = data
        .filter((e) => e.event_type === "PAYOUT_SENT")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const riskReserve = data
        .filter((e) => e.blocked === true)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      setMetrics({
        incomingPayments,
        escrowHoldings,
        vendorPayouts,
        riskReserve,
      });
    };

    loadMetrics();

    const channel = supabase
      .channel("treasury-flow-map")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_entries",
        },
        loadMetrics,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const flows = [
    {
      title: "Incoming Payments",
      amount: metrics.incomingPayments,
      color: "bg-blue-500",
    },
    {
      title: "Escrow Holdings",
      amount: metrics.escrowHoldings,
      color: "bg-yellow-500",
    },
    {
      title: "Vendor Payouts",
      amount: metrics.vendorPayouts,
      color: "bg-green-500",
    },
    {
      title: "Risk Reserve",
      amount: metrics.riskReserve,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 overflow-hidden min-h-[320px] flex flex-col">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">Treasury Flow Map</h2>

          <p className="text-zinc-400 text-sm mt-1">
            Live capital movement across the treasury system
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center text-green-400 text-[10px] font-semibold bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/30 leading-none h-fit">
          LIVE
        </span>
      </div>

      {/* FLOW GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 flex-1">
        {flows.map((flow) => (
          <div
            key={flow.title}
            className="min-w-0 bg-zinc-800/80 border border-zinc-700 rounded-2xl p-5 overflow-hidden flex flex-col justify-between items-center text-center"
          >
            <div className={`w-3 h-3 rounded-full ${flow.color} mb-4`} />
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide leading-snug text-center">
              {flow.title}
            </p>

            <p className="text-lg xl:text-xl font-bold text-white mt-3 break-words leading-tight text-center">
              {formatCompact(flow.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
