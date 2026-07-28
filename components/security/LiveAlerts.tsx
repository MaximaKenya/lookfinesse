"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";

import { toast } from "sonner";

export default function LiveAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("alerts-live")

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },

        (payload) => {
          setAlerts((prev) => [
            payload.new,
            ...prev,
          ]);

          toast.error(
            `🚨 ${payload.new.type}`
          );
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-3">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className="bg-red-950 border border-red-500 p-3 rounded-xl"
        >
          <div className="font-bold">
            {alert.type}
          </div>

          <div className="text-sm text-gray-300">
            Severity: {alert.severity}
          </div>
        </div>
      ))}
    </div>
  );
}