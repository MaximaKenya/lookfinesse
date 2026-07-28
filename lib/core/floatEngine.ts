export function computeFloat(totalEscrow: number, payoutDelayDays: number) {
  return totalEscrow * (payoutDelayDays / 30);
}