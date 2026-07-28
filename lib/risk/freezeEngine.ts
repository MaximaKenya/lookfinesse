import { supabase } from "@/lib/supabaseClient";

const FREEZE_THRESHOLD = 80;

export async function evaluateFreeze(vendor_id: string, risk_score: number) {
  const shouldFreeze = risk_score >= FREEZE_THRESHOLD;

  await supabase
    .from("vendor_risk_scores")
    .update({
      is_frozen: shouldFreeze,
      last_updated: new Date().toISOString(),
    })
    .eq("vendor_id", vendor_id);

  return shouldFreeze;
}