import { supabase } from "@/lib/supabaseClient";

export async function checkFraudRules(input: {
  vendor_id: string;
  payout_amount: number;
}) {
  const events: { type: string; severity: number }[] = [];

  // Rule 1: Large payout spike
  if (input.payout_amount > 200000) {
    events.push({
      type: "LARGE_PAYOUT",
      severity: 8,
    });
  }

  // Rule 2: Velocity spike (last 1 hour)
  const { data: recent } = await supabase
    .from("payout_queue")
    .select("*")
    .eq("vendor_id", input.vendor_id)
    .gte(
      "created_at",
      new Date(Date.now() - 60 * 60 * 1000).toISOString()
    );

  if ((recent?.length ?? 0) > 5) {
    events.push({
      type: "VELOCITY_SPIKE",
      severity: 7,
    });
  }

  return events;
}