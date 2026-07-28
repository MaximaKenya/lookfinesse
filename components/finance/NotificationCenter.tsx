"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatEvent, getEventType } from "@/lib/finance/eventRegistry";

type Notification = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  type: "success" | "warning" | "danger" | "info";
};

type LedgerEntry = {
  id: string;
  event_type: string | null;
  reference_id: string | null;
  created_at: string;
};

function safeEvent(eventType: string | null) {
  if (!eventType || eventType === "UNKNOWN_EVENT") return null;
  return eventType;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase
        .from("ledger_entries")
        .select("id, event_type, reference_id, created_at")
        .order("created_at", { ascending: false })
        .limit(15);

      if (!mounted || !data) return;

      const mapped: Notification[] = (data as LedgerEntry[])
        .map((entry) => {
          const eventType = safeEvent(entry.event_type);

          if (!eventType) return null;

          return {
            id: entry.id,
            title: formatEvent(eventType),
            description: entry.reference_id || "Financial event recorded",
            created_at: entry.created_at,
            type: getEventType(eventType),
          };
        })
        .filter(Boolean) as Notification[];

      setNotifications(mapped);
    }

    load();

    const channel = supabase
      .channel("finance-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ledger_entries" },
        (payload) => {
          const entry = payload.new as LedgerEntry;

          const eventType = safeEvent(entry.event_type);
          if (!eventType) return;

          const newNotification: Notification = {
            id: entry.id,
            title: formatEvent(eventType),
            description: entry.reference_id || "Financial event recorded",
            created_at: entry.created_at,
            type: getEventType(eventType),
          };

          setNotifications((prev) => [newNotification, ...prev.slice(0, 14)]);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  function getStyles(type: Notification["type"]) {
    switch (type) {
      case "danger":
        return "border-red-500/30 bg-red-500/10";
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/10";
      case "success":
        return "border-green-500/30 bg-green-500/10";
      default:
        return "border-blue-500/30 bg-blue-500/10";
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      <div className="flex justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Notification Center</h2>
          <p className="text-zinc-400 text-sm">Realtime financial events</p>
        </div>

       <span className="inline-flex items-center text-green-400 text-[10px] font-semibold bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/30 leading-none h-fit">
          LIVE
        </span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-2xl border p-4 ${getStyles(n.type)}`}
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-zinc-300 mt-1">{n.description}</p>
              </div>

              <p className="text-xs text-zinc-400">
                {new Date(n.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center text-zinc-400 bg-zinc-800 rounded-2xl p-6">
            No valid financial events
          </div>
        )}
      </div>
    </div>
  );
}
