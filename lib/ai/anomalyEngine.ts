export type AnomalyResult = {
  score: number;
  reason: string[];
  risk: "low" | "medium" | "high";
  confidence: number;
  recommendations: string[];
};

type AnomalyInput = {
  amount: number;
  avgAmount: number;

  frequency: number;
  avgFrequency: number;

  refunds?: number;
  failedPayments?: number;

  vendorRiskScore?: number;

  payoutDelayHours?: number;
};

export function detectAnomaly(
  data: AnomalyInput
): AnomalyResult {

  let score = 0;

  const reasons: string[] = [];

  const recommendations: string[] = [];

  // =========================================
  // 🚨 REVENUE SPIKE
  // =========================================
  if (data.amount > data.avgAmount * 2) {
    score += 0.25;

    reasons.push(
      "Revenue spike detected"
    );

    recommendations.push(
      "Review sudden transaction growth"
    );
  }

  // =========================================
  // 🚨 EXTREME SPIKE
  // =========================================
  if (data.amount > data.avgAmount * 5) {
    score += 0.35;

    reasons.push(
      "Extreme payment spike anomaly"
    );

    recommendations.push(
      "Temporarily monitor payout velocity"
    );
  }

  // =========================================
  // 🚨 FREQUENCY ANOMALY
  // =========================================
  if (
    data.frequency >
    data.avgFrequency * 2
  ) {
    score += 0.2;

    reasons.push(
      "Unusual transaction frequency"
    );

    recommendations.push(
      "Inspect bot or abuse activity"
    );
  }

  // =========================================
  // 🚨 LOW BASELINE + HIGH VALUE
  // =========================================
  if (
    data.avgAmount < 1000 &&
    data.amount > 50000
  ) {
    score += 0.3;

    reasons.push(
      "Sudden high-value activity on low baseline account"
    );

    recommendations.push(
      "Escalate vendor review"
    );
  }

  // =========================================
  // 🚨 REFUND ANOMALY
  // =========================================
  if ((data.refunds ?? 0) > 5) {
    score += 0.15;

    reasons.push(
      "Elevated refund activity"
    );

    recommendations.push(
      "Investigate customer disputes"
    );
  }

  // =========================================
  // 🚨 FAILED PAYMENTS
  // =========================================
  if ((data.failedPayments ?? 0) > 3) {
    score += 0.15;

    reasons.push(
      "High failed payment rate"
    );

    recommendations.push(
      "Check payment rail stability"
    );
  }

  // =========================================
  // 🚨 VENDOR RISK
  // =========================================
  if ((data.vendorRiskScore ?? 0) > 70) {
    score += 0.2;

    reasons.push(
      "High vendor risk score"
    );

    recommendations.push(
      "Reduce payout exposure"
    );
  }

  // =========================================
  // 🚨 PAYOUT DELAY RISK
  // =========================================
  if ((data.payoutDelayHours ?? 0) > 24) {
    score += 0.1;

    reasons.push(
      "Payout processing delays detected"
    );

    recommendations.push(
      "Review treasury liquidity"
    );
  }

  // =========================================
  // FINAL RISK LEVEL
  // =========================================
  const normalizedScore =
    Math.min(score, 1);

  const risk =
    normalizedScore > 0.75
      ? "high"
      : normalizedScore > 0.4
      ? "medium"
      : "low";

  // =========================================
  // CONFIDENCE SCORE
  // =========================================
  const confidence =
    Math.min(
      0.5 +
        reasons.length * 0.1,
      0.95
    );

  return {
    score: normalizedScore,
    reason: reasons,
    risk,
    confidence,
    recommendations,
  };
}