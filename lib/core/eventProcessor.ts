import { supabase } from "@/lib/supabaseClient";

export async function processEvents() {
  const { data: events } = await supabase
    .from("ledger_events")
    .select("*")
    .order("created_at", { ascending: true });

  for (const e of events || []) {
    if (e.event_type === "payout_requested") {
      // apply journal entry here
    }
  }
}