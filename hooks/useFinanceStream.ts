// /hooks/useFinanceStream.ts

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useFinanceStream(vendorId?: string) {
  const [data, setData] = useState<any[]>([]);
  const loadingRef = useRef(false);

  const load = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const { data } = await supabase
        .from("ledger_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setData(data || []);
    } finally {
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    if (!vendorId) return;

    // ✅ SAFE INITIAL LOAD (no sync setState warning)
    (async () => {
      await load();
    })();

    // ✅ REALTIME SUBSCRIPTION
    const channel = supabase
      .channel("finance-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ledger_entries" },
        () => {
          // slight debounce effect
          setTimeout(load, 150);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  return data;
}