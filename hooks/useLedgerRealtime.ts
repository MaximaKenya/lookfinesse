"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Realtime ledger listener
 * Automatically refreshes finance dashboard when data changes
 */
export function useLedgerRealtime(load: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel("finance-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets" },
        load
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ledger_entries" },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);
}