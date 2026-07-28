"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  formatEvent,
  getEventType,
} from "@/lib/finance/eventRegistry";

type LedgerEntry = {
  id: string;
  event_type: string | null;
  amount: number;
  created_at: string;
  description?: string | null;
  type?: string | null;
  direction?: string | null;
};

export default function TransactionStream() {
  const [events, setEvents] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("ledger_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setEvents(data || []);
    };

    load();

    const channel = supabase
      .channel("transaction-stream")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_entries",
        },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * NORMALIZE EVENT
   */
  function normalizeEvent(event?: string | null) {
    if (!event) return "";

    return event.trim().toUpperCase().replace(/\s+/g, "_");
  }

  /**
   * SMART FALLBACK SYSTEM
   */
  function resolveLabel(entry: LedgerEntry) {
    const normalized = normalizeEvent(entry.event_type);

    // known registry event
    const formatted = formatEvent(normalized);

    if (!formatted.startsWith("Unknown Event")) {
      return formatted;
    }

    // infer from type
    if (entry.type === "payout_request") {
      return "Payout Request";
    }

    if (entry.direction === "credit") {
      return "Funds Received";
    }

    if (entry.direction === "debit") {
      return "Funds Sent";
    }

    return "Financial Activity";
  }

  /**
   * EVENT COLORS
   */
  function getCardStyles(entry: LedgerEntry) {
    const normalized = normalizeEvent(entry.event_type);

    const type = getEventType(normalized);

    switch (type) {
      case "success":
        return {
          dot: "bg-green-400",
          card: "bg-green-500/5 border-green-500/20",
        };

      case "danger":
        return {
          dot: "bg-red-400",
          card: "bg-red-500/5 border-red-500/20",
        };

      case "warning":
        return {
          dot: "bg-yellow-400",
          card: "bg-yellow-500/5 border-yellow-500/20",
        };

      default:
        return {
          dot: "bg-blue-400",
          card: "bg-blue-500/5 border-blue-500/20",
        };
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
      
      {/* HEADER */}
      <div className="px-5 pt-5 pb-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">
            Transaction Stream
          </h3>

          <p className="text-zinc-500 text-xs mt-1">
            Realtime financial activity
          </p>
        </div>

         <span className="inline-flex items-center text-green-400 text-[10px] font-semibold bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/30 leading-none h-fit">
          LIVE
        </span>
      </div>

      {/* STREAM */}
      <div className="max-h-[480px] overflow-y-auto">
        {events.map((entry) => {
          const styles = getCardStyles(entry);

          return (
            <div
              key={entry.id}
              className="group px-5 py-4 border-b border-zinc-800 hover:bg-zinc-800/40 transition-all"
            >
              <div className="flex items-start gap-4">
                
                {/* DOT */}
                <div
                  className={`mt-1 h-2.5 w-2.5 rounded-full ${styles.dot}`}
                />

                {/* CONTENT */}
                <div className="flex-1 min-w-0">
                  
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {resolveLabel(entry)}
                      </p>

                      <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                        {entry.description ||
                          "Realtime ledger activity detected"}
                      </p>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <p className="text-sm font-semibold text-white">
                        KES{" "}
                        {Number(entry.amount || 0).toLocaleString()}
                      </p>

                      <p className="text-[11px] text-zinc-500 mt-1">
                        {new Date(
                          entry.created_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* MINI META */}
                  <div className="flex items-center gap-2 mt-3">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${styles.dot}`}
                    />

                    <p className="text-[11px] text-zinc-600 uppercase tracking-wide">
                      {entry.direction || "system"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* EMPTY */}
        {events.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-zinc-400 text-sm">
              No financial activity yet
            </p>

            <p className="text-zinc-600 text-xs mt-2">
              Ledger events will appear here in realtime
            </p>
          </div>
        )}
      </div>
    </div>
  );
}