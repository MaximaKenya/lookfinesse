export async function processMpesaPayout(
  payout: any
) {
  await new Promise((r) => setTimeout(r, 500));

  return {
    success: Math.random() > 0.1,
    rail: "MPESA",
  };
}