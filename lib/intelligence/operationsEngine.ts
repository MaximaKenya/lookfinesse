// lib/intelligence/operationsEngine.ts

export type OperationalInsight = {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  riskScore: number;

  insight: string;

  recommendation: string;

  confidence: number;

  liquidityImpact: number;

  treasuryImpact: number;

  operationalPriority: number;
};

export function buildOperationalInsight(event: any): OperationalInsight {
  const amount = Number(event.amount || 0);

  const failedAttempts =
    Number(event.failed_attempts || 0);

  const geoVelocity =
    Boolean(event.geo_velocity_flag);

  const newDevice =
    Boolean(event.is_new_device);

  const riskScore =
    Number(event.risk_score || 0);

  /**
   * RISK MODEL
   */

  let score = 0;

  score += riskScore;

  if (amount > 500000) {
    score += 25;
  }

  if (failedAttempts >= 3) {
    score += 20;
  }

  if (geoVelocity) {
    score += 30;
  }

  if (newDevice) {
    score += 15;
  }

  /**
   * SEVERITY
   */

  let severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL" = "LOW";

  if (score >= 90) {
    severity = "CRITICAL";
  } else if (score >= 70) {
    severity = "HIGH";
  } else if (score >= 40) {
    severity = "MEDIUM";
  }

  /**
   * DYNAMIC INSIGHT
   */

  let insight =
    "Normal financial activity detected.";

  if (severity === "CRITICAL") {
    insight =
      "Extreme payout anomaly detected across treasury infrastructure.";
  } else if (severity === "HIGH") {
    insight =
      "Suspicious vendor behavior deviates significantly from operational baseline.";
  } else if (severity === "MEDIUM") {
    insight =
      "Elevated transactional risk identified within payout flow.";
  }

  /**
   * DYNAMIC RECOMMENDATIONS
   */

  let recommendation =
    "Continue monitoring operational activity.";

  if (severity === "CRITICAL") {
    recommendation =
      "Freeze payout execution and escalate compliance investigation immediately.";
  } else if (severity === "HIGH") {
    recommendation =
      "Throttle vendor payouts and trigger enhanced verification review.";
  } else if (severity === "MEDIUM") {
    recommendation =
      "Increase treasury observation and monitor vendor payout velocity.";
  }

  return {
    severity,

    riskScore: score,

    insight,

    recommendation,

    confidence: Math.min(
      99,
      Math.floor(score * 0.95)
    ),

    liquidityImpact:
      amount > 300000 ? 75 : 25,

    treasuryImpact:
      amount > 500000 ? 90 : 40,

    operationalPriority: score,
  };
}