import { supabase } from "@/lib/supabaseClient";

export function subscribeToFinancialEvents(
  callback: (payload: any) => void
) {
  return supabase
    .channel("financial-events-live")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "financial_events",
      },
      callback
    )
    .subscribe();
}