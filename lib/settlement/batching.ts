import { supabase } from "@/lib/supabaseClient";

export async function createSettlementBatch() {
  const { data: payouts } = await supabase
    .from("payout_queue")
    .select("*")
    .eq("status", "SENT");

  if (!payouts?.length) return;

  const total = payouts.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  await supabase.from("settlement_batches").insert([
    {
      total_amount: total,
      payout_count: payouts.length,
      status: "PENDING",
    },
  ]);

  return {
    total_amount: total,
    payout_count: payouts.length,
  };
}