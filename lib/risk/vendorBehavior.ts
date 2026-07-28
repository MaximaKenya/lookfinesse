type VendorBehaviorInput = {
  payoutFailures: number;
  refunds: number;
  fraudFlags: number;
  successfulOrders: number;
};

export function calculateVendorTrustScore(
  input: VendorBehaviorInput
) {
  let score = 100;

  score -= input.payoutFailures * 10;

  score -= input.refunds * 3;

  score -= input.fraudFlags * 25;

  score +=
    input.successfulOrders * 0.05;

  return Math.max(
    Math.min(score, 100),
    0
  );
}