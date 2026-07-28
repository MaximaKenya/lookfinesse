export function generateTreasuryInsight(params: {
  reserve_ratio: number;
  fx_exposure: number;
}) {
  if (params.reserve_ratio < 20) {
    return `
Treasury reserve ratio is critically low.
Recommend slowing non-priority payouts.
`;
  }

  if (params.fx_exposure > 1000000) {
    return `
FX exposure exceeds recommended threshold.
Consider reserve balancing.
`;
  }

  return `
Treasury systems operating normally.
`;
}