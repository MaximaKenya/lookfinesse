export function determineTreasuryAction(
  riskScore: number
) {

  if (riskScore >= 90) {
    return {
      action: "freeze_payouts",
      reason:
        "Critical liquidity threat",
    };
  }

  if (riskScore >= 70) {
    return {
      action: "delay_large_payouts",
      reason:
        "High treasury stress",
    };
  }

  return {
    action: "normal_operations",
    reason: "Treasury healthy",
  };
}