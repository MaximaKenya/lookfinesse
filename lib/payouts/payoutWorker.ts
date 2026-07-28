import { supabase } from "@/lib/supabaseClient";
import { processSinglePayout } from "./processSinglePayout";

export async function runPayoutWorker() {
  const { data: payouts } = await supabase
    .from("payout_queue")
    .select("*")
    .in("status", ["QUEUED", "RETRY_SCHEDULED"])
    .lte("next_retry_at", new Date().toISOString())
    .order("priority", { ascending: false })
    .limit(25);

  if (!payouts?.length) return;

  for (const payout of payouts) {
    await processSinglePayout(payout.id);
  }
}