import { LedgerEntry } from "@/types/intelligence";

export function computeRiskEngine(
  transactions: LedgerEntry[]
) {
  let totalRisk = 0;

  const suspicious = [];

  for (const txn of transactions) {
    let risk = 0;

    if (txn.amount > 100000) risk += 0.4;

    if (txn.failed_attempts > 3) risk += 0.3;

    if (txn.is_new_device) risk += 0.2;

    if (txn.geo_velocity_flag) risk += 0.4;

    txn.risk_score = Math.min(risk, 1);

    totalRisk += txn.risk_score;

    if (txn.risk_score > 0.7) {
      suspicious.push(txn);
    }
  }

  return {
    averageRisk:
      transactions.length > 0
        ? totalRisk / transactions.length
        : 0,

    suspiciousCount: suspicious.length,

    suspiciousTransactions: suspicious,

    summary:
      suspicious.length > 0
        ? `${suspicious.length} suspicious transactions detected`
        : "System stable",
  };
}