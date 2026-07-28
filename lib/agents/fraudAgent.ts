import { addMemory } from "./sharedMemory";

import { LedgerEntry } from "@/types/system";

export async function fraudAgent(
  transactions: LedgerEntry[]
) {
  const suspicious =
    transactions.filter(
      (t) =>
        (t.failed_attempts || 0) >
          3 ||
        t.geo_velocity_flag
    );

  if (suspicious.length > 0) {
    addMemory({
      agent: "FraudAgent",

      type: "THREAT_DETECTED",

      message: `${suspicious.length} suspicious transactions detected`,

      timestamp: Date.now(),
    });
  }

  return {
    suspiciousCount:
      suspicious.length,

    suspicious,
  };
}