import { addMemory } from "./sharedMemory";

import { LedgerEntry } from "@/types/system";

export async function treasuryAgent(
  transactions: LedgerEntry[]
) {
  const exposure =
    transactions.reduce(
      (sum, txn) =>
        sum + txn.amount,
      0
    );

  if (exposure > 1000000) {
    addMemory({
      agent: "TreasuryAgent",

      type: "HIGH_EXPOSURE",

      message:
        "Treasury exposure elevated",

      timestamp: Date.now(),
    });
  }

  return {
    totalExposure: exposure,
  };
}