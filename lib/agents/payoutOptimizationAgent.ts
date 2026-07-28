import { addMemory } from "./sharedMemory";

import { LedgerEntry } from "@/types/system";

export async function payoutOptimizationAgent(
  transactions: LedgerEntry[]
) {
  const largePayouts =
    transactions.filter(
      (txn) =>
        txn.amount > 100000
    );

  if (largePayouts.length > 5) {
    addMemory({
      agent:
        "PayoutOptimizationAgent",

      type:
        "PAYOUT_REBALANCE",

      message:
        "Large payout cluster detected",

      timestamp: Date.now(),
    });
  }

  return {
    largePayouts:
      largePayouts.length,
  };
}