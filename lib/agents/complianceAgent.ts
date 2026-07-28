import { addMemory } from "./sharedMemory";
import { LedgerEntry } from "@/types/system";

export async function complianceAgent(
  transactions: LedgerEntry[]
) {
  const highValue = transactions.filter(
    (t) => Number(t.amount) > 1000000
  );

  const geoRisk = transactions.filter(
    (t) =>
      t.geo_location &&
      ["Unknown", "Dubai", "Lagos"].includes(
        t.geo_location
      )
  );

  const violations = [
    ...highValue,
    ...geoRisk,
  ];

  if (violations.length > 0) {
    addMemory({
      agent: "ComplianceAgent",
      type: "COMPLIANCE_ALERT",
      message: `${violations.length} transactions require compliance review`,
      timestamp: Date.now(),
    });
  }

  return {
    status:
      violations.length > 0
        ? "warning"
        : "ok",

    violations,

    totalViolations:
      violations.length,

    highValueTransfers:
      highValue.length,

    geoRiskEvents:
      geoRisk.length,
  };

  
}

