import { addMemory } from "./sharedMemory";

export async function vendorRiskAgent(vendors: any[]) {
  const risky = vendors
    .filter((v) => (v.risk_score ?? 0) > 0.8)
    .map((v) => ({
      id: v.id ?? v.vendor_id,
      riskScore: v.risk_score ?? 0,
      flags:
        (v.risk_score ?? 0) > 0.9
          ? ["HIGH_RISK_SCORE"]
          : ["MEDIUM_RISK_SCORE"],
    }));

  if (risky.length > 0) {
    addMemory({
      agent: "VendorRiskAgent",
      type: "RISKY_VENDOR",
      message: `${risky.length} high-risk vendors detected`,
      timestamp: Date.now(),
    });
  }

  return {
    risky,
  };
}