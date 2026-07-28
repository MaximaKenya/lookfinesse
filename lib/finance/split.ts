export function calculateSplit(amount: number) {
  const platformFeeRate = 0.1; // 10%

  const fee = amount * platformFeeRate;
  const vendorEarnings = amount - fee;

  return {
    fee,
    vendorEarnings,
  };
}