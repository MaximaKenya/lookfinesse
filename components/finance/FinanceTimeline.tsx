"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatEvent } from "@/lib/finance/eventRegistry";

type LedgerEvent = {
  id: string;
  event_type: string | null;
  amount: number;
  created_at: string;
  category: string | null;
};

type Filter = "ALL" | "PAYMENTS" | "FRAUD" | "SYSTEM";

function safeEvent(e: string | null) {
  if (!e || e === "UNKNOWN_EVENT") return null;
  return e;
}

export default function FinancialTimeline() {
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("ledger_entries")
        .select("id, event_type, amount, created_at, category")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!data) return;

      const cleaned = (data as LedgerEvent[]).filter(
        (e) => safeEvent(e.event_type) !== null
      );

      setEvents(cleaned);
    }

    load();
  }, []);

  const filtered = events.filter((e) => {
    if (filter === "ALL") return true;
    if (filter === "PAYMENTS") return e.category === "payment";
    if (filter === "FRAUD") return e.category === "fraud";
    if (filter === "SYSTEM") return e.category === "system";
    return true;
  });

  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Financial Timeline</h2>

        <div className="flex gap-2">
          {(["ALL", "PAYMENTS", "FRAUD", "SYSTEM"] as Filter[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-xl text-xs border ${
                  filter === f
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
                }`}
              >
                {f}
              </button>
            )
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filtered.map((e) => (
          <div
            key={e.id}
            className="bg-zinc-800 rounded-2xl p-4 border border-zinc-700"
          >
            <div className="flex justify-between">
              <p className="font-semibold">
                {formatEvent(e.event_type!)}
              </p>

              <span className="text-xs text-zinc-400">
                {new Date(e.created_at).toLocaleTimeString()}
              </span>
            </div>

            <p className="text-sm text-zinc-400 mt-1">
              Amount: KES {e.amount.toLocaleString()}
            </p>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-zinc-400 bg-zinc-800 rounded-2xl p-6">
            No events in this filter
          </div>
        )}
      </div>
    </div>
  );
}