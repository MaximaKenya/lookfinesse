import { processMpesaPayout } from "./mpesaRail";
import { processBankPayout } from "./bankRail";
import { processCardPayout } from "./cardRail";

export async function routePayout(payout: any) {
  // EXAMPLE ROUTING STRATEGY

  if (payout.amount < 5000) {
    return processMpesaPayout(payout);
  }

  if (payout.amount < 50000) {
    return processBankPayout(payout);
  }

  return processCardPayout(payout);
}