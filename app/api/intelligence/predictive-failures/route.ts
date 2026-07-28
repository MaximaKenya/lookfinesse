import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const [{ count: pendingPayouts }, { count: fraudEvents }, { data: forecasts }] =
    await Promise.all([
      supabase
        .from("payouts")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("financial_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "fraud_detected"),
      supabase
        .from("payout_forecasts")
        .select("expected_outflow, confidence_score")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const pending = pendingPayouts ?? 0;
  const fraud = fraudEvents ?? 0;

  const avgConfidence =
    forecasts && forecasts.length > 0
      ? forecasts.reduce(
          (sum, f) => sum + Number(f.confidence_score ?? 0),
          0
        ) / forecasts.length
      : 0;

  const settlementDelayRisk = Math.min(100, pending * 4);
  const treasuryStress = Math.min(
    100,
    Math.round(avgConfidence > 0 ? 100 - avgConfidence : pending * 3)
  );
  const fraudSpike = Math.min(100, fraud * 12);

  const predictions = [
    {
      label: "Settlement Delay Risk",
      value: `${settlementDelayRisk}%`,
      color:
        settlementDelayRisk >= 40
          ? "text-red-400"
          : settlementDelayRisk >= 15
            ? "text-yellow-400"
            : "text-green-400",
    },
    {
      label: "Treasury Stress Probability",
      value: `${treasuryStress}%`,
      color:
        treasuryStress >= 40
          ? "text-red-400"
          : treasuryStress >= 15
            ? "text-yellow-400"
            : "text-green-400",
    },
    {
      label: "Fraud Spike Projection",
      value: `${fraudSpike}%`,
      color:
        fraudSpike >= 40
          ? "text-red-400"
          : fraudSpike >= 15
            ? "text-yellow-400"
            : "text-green-400",
    },
  ];

  return NextResponse.json({
    predictions,
    empty: pending === 0 && fraud === 0 && (forecasts?.length ?? 0) === 0,
  });
}
