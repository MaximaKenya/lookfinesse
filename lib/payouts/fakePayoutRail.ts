export async function fakePayoutRail(payout: any) {
  // simulate network delay
  await new Promise((r) => setTimeout(r, 800));

  // simulate 85% success rate
  return Math.random() > 0.15;
}