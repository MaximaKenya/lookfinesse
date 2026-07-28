"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  getFinanceMetrics,
  FinanceMetrics,
} from "@/lib/finance/dashboard";

export default function PayoutCenter() {
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
      .channel("payout-center")
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

  const handlePayout = async () => {
    try {
      if (metrics.fraudAlerts > 0) {
        alert("Payout blocked: fraud signals detected");
        return;
      }

      if (metrics.availableBalance <= 0) {
        alert("No available balance");
        return;
      }

      const { error } = await supabase.from("payout_requests").insert([
        {
          amount: metrics.availableBalance,
          status: "pending",
          created_at: new Date().toISOString(),
          risk_snapshot: {
            fraudAlerts: metrics.fraudAlerts,
            escrow: metrics.escrowBalance,
          },
        },
      ]);

      if (error) throw error;

      await supabase.from("ledger_entries").insert([
  {
    amount: -metrics.availableBalance,
    type: "payout_request",
    direction: "debit",
    status: "pending",
    event_type: "PAYOUT_INITIATED",
    description: "User initiated payout request",

    // 🔥 REQUIRED FIELDS (based on your schema)
    currency: "KES",
    user_id: "CURRENT_USER_ID", // replace with auth user
    tenant_id: "DEFAULT_TENANT", // if multi-tenant
    idempotency_key: crypto.randomUUID(),
  },
]);

      alert("Payout request submitted");
    } catch (err: any) {
  console.error("FULL PAYOUT ERROR:", err);
  console.error("MESSAGE:", err?.message);
  console.error("DETAILS:", err?.details);
  console.error("HINT:", err?.hint);
  alert(err?.message || "Payout failed");
}
  };

  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-6">Payout Center</h2>

      <div className="space-y-4">
        <div className="bg-zinc-800 rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Available Payout</p>

          <h3 className="text-3xl font-bold mt-2 text-green-400">
            KES {metrics.availableBalance.toLocaleString()}
          </h3>

          <p className="text-xs text-zinc-500 mt-1">
            Escrow: KES {metrics.escrowBalance.toLocaleString()} • Pending: KES{" "}
            {metrics.pendingPayouts.toLocaleString()}
          </p>
        </div>

        {metrics.fraudAlerts > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-red-400 text-sm">
              ⚠ {metrics.fraudAlerts} fraud signal(s) detected
            </p>
          </div>
        )}

        <button
          onClick={handlePayout}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-bold rounded-2xl py-4 transition-all"
        >
          Send Payout
        </button>
      </div>
    </div>
  );
}