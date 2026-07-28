type InsightInput = {
  suspiciousTransactions: number;
  pendingPayouts: number;
  liquidityRatio: number;
  revenueToday: number;
};

export function buildExecutiveInsights(
  input: InsightInput
) {
  const insights: string[] = [];

  if (input.suspiciousTransactions > 5) {
    insights.push(
      `${input.suspiciousTransactions} suspicious transactions detected across the marketplace.`
    );
  }

  if (input.pendingPayouts > 10) {
    insights.push(
      `${input.pendingPayouts} payouts are currently awaiting settlement.`
    );
  }

  if (input.liquidityRatio < 40) {
    insights.push(
      `Treasury liquidity has fallen below optimal operational thresholds.`
    );
  }

  if (input.revenueToday > 1000000) {
    insights.push(
      `Marketplace revenue exceeded KES 1M today.`
    );
  }

  if (insights.length === 0) {
    insights.push(
      `All operational intelligence systems are functioning normally.`
    );
  }

  return insights;
}