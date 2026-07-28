type RiskInput = {
  failedPayouts: number;
  refundRate: number;
  disputeRate: number;
  transactionVelocity: number;
};

export function calculateRiskScore(
  data: RiskInput
) {
  let score = 0;

  score += data.failedPayouts * 15;
  score += data.refundRate * 25;
  score += data.disputeRate * 20;

  if (data.transactionVelocity > 100) {
    score += 20;
  }

  return Math.min(score, 100);
}

export function getRiskLevel(
  score: number
) {
  if (score >= 80) return "critical";

  if (score >= 60) return "high";

  if (score >= 40) return "medium";

  return "low";
}