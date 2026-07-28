import { supabase } from "@/lib/supabaseClient";

export async function runDefenseEngine(
  vendorId: string,
  riskScore: number
) {
  if (riskScore < 80) {
    return {
      action: "NONE",
    };
  }

  await supabase
    .from("vendors")
    .update({
      payouts_frozen: true,
    })
    .eq("id", vendorId);

  return {
    action: "PAYOUTS_FROZEN",

    reason:
      "Critical behavioral anomaly",
  };
}