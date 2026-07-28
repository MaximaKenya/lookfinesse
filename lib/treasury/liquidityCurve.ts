export function buildLiquidityCurve(
  balances: number[]
) {
  const average =
    balances.reduce(
      (a, b) => a + b,
      0
    ) / balances.length;

  const trend =
    balances[balances.length - 1] -
    balances[0];

  return {
    average,

    trend,

    direction:
      trend > 0
        ? "up"
        : trend < 0
        ? "down"
        : "stable",
  };
}