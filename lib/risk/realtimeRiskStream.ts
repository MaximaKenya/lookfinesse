import { supabase } from "@/lib/supabaseClient";

type RiskUpdateHandler = (payload: any) => void;

export function subscribeToRiskStream(handler: RiskUpdateHandler) {
  const channel = supabase
    .channel("risk-stream")

    // PAYOUT CHANGES
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "payout_queue" },
      handler
    )

    // FRAUD EVENTS
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "fraud_events" },
      handler
    )

    // RISK SCORE CHANGES
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "vendor_risk_scores" },
      handler
    )

    .subscribe();

  return channel;
}