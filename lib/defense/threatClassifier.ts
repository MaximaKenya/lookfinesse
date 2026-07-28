export interface ThreatResult {
  level: "low" | "medium" | "high" | "critical";

  actions: string[];

  reason: string;
}

export function classifyThreat(
  transaction: any
): ThreatResult {
  let score = 0;

  const reasons: string[] = [];

  if (transaction.amount > 200000) {
    score += 30;

    reasons.push(
      "Large transaction amount"
    );
  }

  if (
    transaction.failed_attempts > 3
  ) {
    score += 25;

    reasons.push(
      "Multiple failed attempts"
    );
  }

  if (
    transaction.geo_velocity_flag
  ) {
    score += 30;

    reasons.push(
      "Geo velocity anomaly"
    );
  }

  if (
    transaction.is_new_device
  ) {
    score += 15;

    reasons.push(
      "Unrecognized device"
    );
  }

  if (score >= 70) {
    return {
      level: "critical",

      actions: [
        "freeze_payout",
        "block_transaction",
        "escalate_cluster",
      ],

      reason: reasons.join(", "),
    };
  }

  if (score >= 40) {
    return {
      level: "high",

      actions: [
        "quarantine_vendor",
      ],

      reason: reasons.join(", "),
    };
  }

  return {
    level: "low",

    actions: [],

    reason:
      "No major anomaly detected",
  };
}