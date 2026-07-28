import { supabase } from "@/lib/supabaseClient";

export async function generatePayoutForecast() {
  const { data: payouts } = await supabase
    .from("payout_queue")
    .select("*")
    .in("status", ["QUEUED", "PROCESSING"]);

  const total =
    payouts?.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    ) ?? 0;

  const confidence =
    total > 1000000 ? 90 : 70;

  await supabase.from("payout_forecasts").insert([
    {
      forecast_date: new Date().toISOString(),
      expected_outflow: total,
      confidence_score: confidence,
    },
  ]);

  return {
    expected_outflow: total,
    confidence_score: confidence,
  };
}