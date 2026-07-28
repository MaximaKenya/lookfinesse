"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getFinanceMetrics, FinanceMetrics } from "@/lib/finance/dashboard";

export default function FinancePulsePanel() {
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
      .channel("finance-pulse")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ledger_entries" },
        load
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mt-4">
      <h3 className="text-white font-bold mb-4">
        Financial Pulse
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-zinc-400">
          <span>Available</span>
          <span className="text-green-400">
            KES {metrics.availableBalance.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-zinc-400">
          <span>Escrow</span>
          <span>
            KES {metrics.escrowBalance.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-zinc-400">
          <span>Pending</span>
          <span>
            KES {metrics.pendingPayouts.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-zinc-400">
          <span>Fraud Alerts</span>
          <span
            className={
              metrics.fraudAlerts > 0
                ? "text-red-400"
                : "text-green-400"
            }
          >
            {metrics.fraudAlerts}
          </span>
        </div>
      </div>

      <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{
            width: `${Math.min(
              100,
              (metrics.availableBalance / 100000) * 100
            )}%`,
          }}
        />
      </div>
    </div>
  );
}