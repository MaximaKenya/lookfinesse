"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SystemHealthMini() {
  const [status, setStatus] = useState({
    uptime: 99.98,
    activeConnections: 0,
    riskLevel: "low",
  });

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase
        .from("ledger_entries")
        .select("*", { count: "exact", head: true });

      setStatus((prev) => ({
        ...prev,
        activeConnections: count || 0,
      }));
    };

    load();
  }, []);

  const riskColor =
    status.riskLevel === "high"
      ? "text-red-400"
      : status.riskLevel === "medium"
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 min-h-[200px] flex flex-col justify-between">
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400 font-medium">
          System Health
        </p>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-semibold">
            OPTIMAL
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-4">
        <div>
          <p className="text-zinc-500 text-xs">Uptime</p>
          <p className="text-lg font-semibold text-white">
            {status.uptime}%
          </p>
        </div>

        <div>
          <p className="text-zinc-500 text-xs">Events</p>
          <p className="text-lg font-semibold text-white">
            {status.activeConnections}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5">
        <p className="text-xs text-zinc-500">Risk Level</p>

        <span className={`text-xs font-semibold ${riskColor}`}>
          {status.riskLevel.toUpperCase()}
        </span>
      </div>
    </div>
  );
}