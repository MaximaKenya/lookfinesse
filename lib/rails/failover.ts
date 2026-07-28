import { processMpesaPayout } from "./mpesaRail";
import { processBankPayout } from "./bankRail";
import { processCardPayout } from "./cardRail";

export async function failoverPayout(
  payout: any
) {
  const rails = [
    processMpesaPayout,
    processBankPayout,
    processCardPayout,
  ];

  for (const rail of rails) {
    const result = await rail(payout);

    if (result.success) {
      return result;
    }
  }

  throw new Error("All payout rails failed");
}