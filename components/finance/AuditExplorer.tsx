"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatEvent, getEventType } from "@/lib/finance/eventRegistry";

type AuditEvent = {
  id: string;
  event_type: string | null;
  reference_id: string | null;
  created_at: string;
};

function safeEvent(eventType: string | null) {
  if (!eventType || eventType === "UNKNOWN_EVENT") return null;
  return eventType;
}

export default function AuditExplorer() {
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("ledger_entries")
        .select("id, event_type, reference_id, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!data) return;

      const filtered = (data as AuditEvent[]).filter(
        (e) => safeEvent(e.event_type) !== null
      );

      setEvents(filtered);
    }

    load();
  }, []);

  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-6">Audit Explorer</h2>

      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="bg-zinc-800 rounded-2xl p-4">
            <div className="flex justify-between">
              <p className="font-semibold">
                {formatEvent(e.event_type!)}
              </p>

              <span className="text-xs text-zinc-400">
                {new Date(e.created_at).toLocaleString()}
              </span>
            </div>

            <p className="text-sm text-zinc-400 mt-1">
              {e.reference_id || "No reference attached"}
            </p>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center text-zinc-400 bg-zinc-800 rounded-2xl p-6">
            No audit events found
          </div>
        )}
      </div>
    </div>
  );
}