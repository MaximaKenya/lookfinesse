import { supabase } from "@/lib/supabaseClient";

export interface BehavioralRiskResult {
  score: number;

  reasons: string[];

  severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
}

export async function computeBehavioralRisk(
  vendorId: string,
  transaction: {
    amount: number;
    geo_location?: string;
    device_id?: string;
    created_at?: string;
  }
): Promise<BehavioralRiskResult> {
  const { data: profile } = await supabase
    .from("vendor_behavior_profiles")
    .select("*")
    .eq("vendor_id", vendorId)
    .single();

  if (!profile) {
    return {
      score: 20,
      severity: "LOW",
      reasons: [
        "New vendor profile",
      ],
    };
  }

  let riskScore = 0;

  const reasons: string[] = [];

  /**
   * TRANSACTION DEVIATION
   */

  const avg =
    Number(
      profile.avg_transaction_amount
    ) || 1;

  if (transaction.amount > avg * 5) {
    riskScore += 35;

    reasons.push(
      "Transaction exceeds historical baseline"
    );
  }

  /**
   * GEO DEVIATION
   */

  if (
    transaction.geo_location &&
    !profile.normal_geo_locations?.includes(
      transaction.geo_location
    )
  ) {
    riskScore += 25;

    reasons.push(
      "New geographic activity detected"
    );
  }

  /**
   * DEVICE DEVIATION
   */

  if (
    transaction.device_id &&
    !profile.known_devices?.includes(
      transaction.device_id
    )
  ) {
    riskScore += 20;

    reasons.push(
      "Unknown device fingerprint"
    );
  }

  /**
   * TIMING DEVIATION
   */

  const hour = new Date(
    transaction.created_at ||
      new Date().toISOString()
  ).getHours();

  if (
    !profile.normal_active_hours?.includes(
      hour
    )
  ) {
    riskScore += 15;

    reasons.push(
      "Abnormal operational timing"
    );
  }

  /**
   * SEVERITY
   */

  let severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL" = "LOW";

  if (riskScore >= 80) {
    severity = "CRITICAL";
  } else if (riskScore >= 55) {
    severity = "HIGH";
  } else if (riskScore >= 30) {
    severity = "MEDIUM";
  }

  return {
    score: riskScore,
    reasons,
    severity,
  };
}