type FraudInput = {
  anomalyScore: number;
  vendorRisk: number;
  refundRate: number;
};

export function calculateFraudProbability(
  input: FraudInput
) {
  let probability = 0;

  probability +=
    input.anomalyScore * 0.5;

  probability +=
    (input.vendorRisk / 100) * 0.3;

  probability +=
    input.refundRate * 0.2;

  return Math.min(
    probability,
    1
  );
}