export function predictPayoutFailure({
  liquidityScore,
  vendorRisk,
  payoutAmount,
}: {
  liquidityScore: number;
  vendorRisk: number;
  payoutAmount: number;
}) {

  let probability = 0;

  if (liquidityScore < 40) {
    probability += 0.4;
  }

  if (vendorRisk > 75) {
    probability += 0.3;
  }

  if (payoutAmount > 100000) {
    probability += 0.2;
  }

  return {
    probability:
      Math.min(probability, 1),

    risk:
      probability > 0.7
        ? "high"
        : probability > 0.4
        ? "medium"
        : "low",
  };
}