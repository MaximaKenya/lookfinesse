export function forecastLiquidity({
  treasuryBalance,
  pendingPayouts,
  avgDailyOutflow,
}: {
  treasuryBalance: number;
  pendingPayouts: number;
  avgDailyOutflow: number;
}) {

  const projectedBalance =
    treasuryBalance -
    pendingPayouts -
    avgDailyOutflow * 7;

  return {
    projectedBalance,

    risk:
      projectedBalance < 0
        ? "critical"
        : projectedBalance < 50000
        ? "high"
        : "healthy",
  };
}