import { supabase } from "@/lib/supabaseClient";

export async function updateVendorTrustScore(
  vendorId: string
) {
  const { data: ledger } =
    await supabase
      .from("ledger_entries")
      .select("*")
      .eq("vendor_id", vendorId);

  if (!ledger || ledger.length === 0)
    return;

  const anomalies = ledger.filter(
    (x) =>
      x.behavioral_risk_severity ===
      "CRITICAL"
  ).length;

  const avgRisk =
    ledger.reduce(
      (sum, x) =>
        sum +
        Number(
          x.behavioral_risk_score || 0
        ),
      0
    ) / ledger.length;

  const trustScore = Math.max(
    0,
    100 - avgRisk - anomalies * 5
  );

  const fraudProbability =
    Math.min(100, avgRisk);

  const operationalStability =
    trustScore > 80
      ? "HIGH"
      : trustScore > 50
      ? "MEDIUM"
      : "LOW";

  const treasuryRisk =
    trustScore > 75
      ? "LOW"
      : trustScore > 45
      ? "MEDIUM"
      : "HIGH";

  await supabase
    .from("vendor_trust_scores")
    .upsert({
      vendor_id: vendorId,

      trust_score: trustScore,

      operational_stability:
        operationalStability,

      treasury_risk:
        treasuryRisk,

      behavioral_confidence:
        100 - avgRisk,

      fraud_probability:
        fraudProbability,

      payout_reliability:
        trustScore,

      anomaly_count: anomalies,

      last_evaluated_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    });
}