export async function processBankPayout(
  payout: any
) {
  await new Promise((r) => setTimeout(r, 800));

  return {
    success: Math.random() > 0.15,
    rail: "BANK",
  };
}