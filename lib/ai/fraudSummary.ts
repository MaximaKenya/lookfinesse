export function generateFraudSummary(params: {
  vendor_id: string;
  failed_attempts: number;
  payout_velocity: number;
}) {
  if (
    params.failed_attempts > 3 &&
    params.payout_velocity > 5
  ) {
    return `
High payout velocity detected for vendor ${params.vendor_id}.
Multiple payout failures observed.
Potential payout abuse risk identified.
`;
  }

  return `
No critical fraud indicators detected.
`;
}