import { classifyThreat } from "./threatClassifier";

import { executeAction } from "./actionEngine";

import { triggerAlert } from "@/lib/alerts/triggerAlert";

export async function runAutonomousDefense(
  transactions: any[]
) {
  const actionsTaken = [];

  for (const txn of transactions) {
    const threat =
      classifyThreat(txn);

    if (
      threat.level ===
        "critical" ||
      threat.level === "high"
    ) {
      for (const action of threat.actions) {
        const result =
          await executeAction(
            action,
            txn
          );

        actionsTaken.push({
          transaction: txn.id,

          action,

          reason: threat.reason,

          result,
        });
      }

      await triggerAlert(
        "AUTONOMOUS_DEFENSE_TRIGGERED",
        {
          transaction: txn.id,

          level: threat.level,

          reason: threat.reason,
        }
      );
    }
  }

  return actionsTaken;
}