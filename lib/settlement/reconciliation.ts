import { supabase } from "@/lib/supabaseClient";

export async function reconcileProvider(
  provider_name: string,
  provider_total: number
) {
  const { data: payouts } = await supabase
    .from("payout_queue")
    .select("*")
    .eq("status", "SENT");

  const internal_total =
    payouts?.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    ) ?? 0;

  const drift =
    internal_total - provider_total;

  const status =
    Math.abs(drift) < 1
      ? "BALANCED"
      : "MISMATCH";

  await supabase
    .from("provider_reconciliation")
    .insert([
      {
        provider_name,
        internal_total,
        provider_total,
        drift,
        status,
      },
    ]);

  return {
    internal_total,
    provider_total,
    drift,
    status,
  };
}