export async function processCardPayout(
  payout: any
) {
  await new Promise((r) => setTimeout(r, 400));

  return {
    success: Math.random() > 0.2,
    rail: "CARD",
  };
}