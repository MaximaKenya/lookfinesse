export function calculateVendorRisk({
  failedPayouts,
  refundRate,
  fraudFlags,
}: {
  failedPayouts: number;
  refundRate: number;
  fraudFlags: number;
}) {

  let risk = 0;

  risk += failedPayouts * 25;

  risk += refundRate * 10;

  risk += fraudFlags * 30;

  return Math.min(risk, 100);
}