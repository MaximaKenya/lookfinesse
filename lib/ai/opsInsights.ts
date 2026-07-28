export function generateOpsInsight(params: {
  payout_delay_minutes: number;
  rail_health: string;
}) {
  if (
    params.payout_delay_minutes > 30
  ) {
    return `
Payout delays increasing beyond target SLA.
Investigate settlement congestion.
`;
  }

  if (
    params.rail_health === "DEGRADED"
  ) {
    return `
One or more payout rails are degraded.
Automatic routing fallback recommended.
`;
  }

  return `
Operations are stable.
`;
}