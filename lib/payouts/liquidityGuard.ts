export function checkLiquidityRisk(
  amount: number,
  availableLiquidity: number
) {
  const ratio = amount / availableLiquidity;

  // prevent draining platform
  if (ratio > 0.5) {
    return {
      allowed: false,
      reason: "Liquidity protection triggered",
    };
  }

  return {
    allowed: true,
  };
}