export function generateCopilotInsights({
  fraudCount,
  payoutFailures,
  treasuryRisk,
}: {
  fraudCount: number;
  payoutFailures: number;
  treasuryRisk: number;
}) {

  const insights: string[] = [];

  if (fraudCount > 5) {
    insights.push(
      "Fraud velocity increasing across payment pipeline"
    );
  }

  if (payoutFailures > 3) {
    insights.push(
      "Payout infrastructure instability detected"
    );
  }

  if (treasuryRisk > 70) {
    insights.push(
      "Treasury liquidity risk elevated"
    );
  }

  return insights;
}