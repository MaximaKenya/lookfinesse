"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type EscrowEvent = {
  id: string;
  event_type: string;
  created_at: string;
  reference_id: string | null;
};

const timelineOrder = [
  "PAYMENT_RECEIVED",
  "ESCROW_HELD",
  "ESCROW_RELEASED",
  "PAYOUT_SENT",
];

export default function EscrowTimeline() {
  const [events, setEvents] = useState<EscrowEvent[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadTimeline() {
      const { data } = await supabase
        .from("ledger_entries")
        .select("*")
        .in("event_type", timelineOrder)
        .order("created_at", { ascending: false })
        .limit(12);

      if (!mounted || !data) return;

      /**
       * Keep proper escrow lifecycle ordering
       */
      const normalized: EscrowEvent[] = timelineOrder
        .map((type) =>
          data.find((e) => e.event_type === type)
        )
        .filter(Boolean) as EscrowEvent[];

      setEvents(normalized);
    }

    loadTimeline();

    const channel = supabase
      .channel("escrow-timeline")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_entries",
        },
        loadTimeline
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  function getColor(event: string) {
    switch (event) {
      case "PAYMENT_RECEIVED":
        return "bg-blue-500";
      case "ESCROW_HELD":
        return "bg-yellow-500";
      case "ESCROW_RELEASED":
        return "bg-green-500";
      case "PAYOUT_SENT":
        return "bg-purple-500";
      default:
        return "bg-zinc-500";
    }
  }

  function getGlow(event: string) {
    switch (event) {
      case "PAYMENT_RECEIVED":
        return "shadow-blue-500/30";
      case "ESCROW_HELD":
        return "shadow-yellow-500/30";
      case "ESCROW_RELEASED":
        return "shadow-green-500/30";
      case "PAYOUT_SENT":
        return "shadow-purple-500/30";
      default:
        return "shadow-zinc-500/20";
    }
  }

  function formatLabel(event: string) {
    switch (event) {
      case "PAYMENT_RECEIVED":
        return "Payment Received";

      case "ESCROW_HELD":
        return "Escrow Held";

      case "ESCROW_RELEASED":
        return "Escrow Released";

      case "PAYOUT_SENT":
        return "Payout Sent";

      default:
        return event
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  return (
<div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 min-h-[380px] flex flex-col">
        {/* HEADER */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Escrow Lifecycle
          </h2>

          <p className="text-zinc-400 text-sm mt-1">
            Settlement progression across payment flow
          </p>
        </div>

        <span className="inline-flex items-center text-green-400 text-[10px] font-semibold bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/30 leading-none h-fit">
          LIVE
        </span>
      </div>

      {/* HORIZONTAL TIMELINE */}
      {events.length > 0 ? (
        <div className="relative">
          {/* TRACK */}
          <div className="absolute top-5 left-0 right-0 h-[2px] bg-zinc-800" />

          <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="relative"
              >
                {/* NODE */}
                <div
                  className={`w-10 h-10 rounded-full ${getColor(
                    event.event_type
                  )} ${getGlow(
                    event.event_type
                  )} shadow-xl border-4 border-zinc-900 z-10 relative`}
                />

                {/* CARD */}
                <div className="mt-4 bg-zinc-800/80 border border-zinc-700 hover:border-zinc-600 transition-all rounded-2xl p-5 backdrop-blur-sm min-h-[210px] flex flex-col">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {formatLabel(event.event_type)}
                      </p>

                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                        {event.reference_id ||
                          "Settlement lifecycle event"}
                      </p>
                    </div>

                    <div className="pt-4">
                      <p className="text-xs text-zinc-500">
                        {new Date(
                          event.created_at
                        ).toLocaleDateString()}
                      </p>

                      <p className="text-xs text-zinc-600 mt-1">
                        {new Date(
                          event.created_at
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-800 border border-zinc-700 rounded-3xl p-10 text-center">
          <p className="text-zinc-300 font-medium">
            No escrow lifecycle events yet
          </p>

          <p className="text-zinc-500 text-sm mt-2">
            Settlement activity will appear here in real time
          </p>
        </div>
      )}
    </div>
  );
}