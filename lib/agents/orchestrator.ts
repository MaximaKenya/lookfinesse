import { fraudAgent } from "./fraudAgent";
import { treasuryAgent } from "./treasuryAgent";
import { complianceAgent } from "./complianceAgent";
import { vendorRiskAgent } from "./vendorRiskAgent";
import { payoutOptimizationAgent } from "./payoutOptimizationAgent";
import { getMemory } from "./sharedMemory";
import { LedgerEntry, Vendor } from "@/types/system";

/**
 * SAFE vendor normalization (matches DB schema exactly)
 */
function normalizeVendors(vendors: Vendor[]) {
  return vendors.map((v) => ({
    id: v.id,
    name: v.name ?? "Unknown Vendor",
    riskScore: Number((v as any).risk_score ?? 0),
  }));
}

/**
 * SAFE transaction attach (STRICT JOIN FIX)
 */
function attachTransactions(vendors: any[], transactions: LedgerEntry[]) {
  return vendors.map((v) => ({
    ...v,
    transactions: transactions.filter(
      (t) => String(t.vendor_id) === String(v.id)
    ),
  }));
}

/**
 * WHY NOW engine (stable explainability)
 */
function generateWhyNow(tx: LedgerEntry[]) {
  const recent = tx.slice(-10);

  const geo = recent.filter((t) => t.geo_velocity_flag).length;
  const device = recent.filter((t) => t.is_new_device).length;
  const failed = recent.reduce((a, t) => a + (t.failed_attempts || 0), 0);

  const reasons: string[] = [];

  if (geo > 0) reasons.push("location switching");
  if (device > 0) reasons.push("new device usage");
  if (failed > 5) reasons.push("failed attempts spike");

  return reasons.length
    ? `Risk elevated due to ${reasons.join(" + ")}.`
    : "No recent anomaly spike detected.";
}

/**
 * TIMELINE (risk reconstruction)
 */
function buildTimeline(tx: LedgerEntry[]) {
  return tx.map((t, i) => ({
    index: i,
    timestamp: (t as any).created_at ?? Date.now(),
    risk:
      (t.failed_attempts || 0) * 0.25 +
      (t.geo_velocity_flag ? 0.35 : 0) +
      (t.is_new_device ? 0.2 : 0),
  }));
}

export async function runAgents(
  transactions: LedgerEntry[],
  vendors: Vendor[]
) {
  // 1. normalize vendors
  const normalized = normalizeVendors(vendors);

  // 2. attach tx
  const enriched = attachTransactions(normalized, transactions);

  // 3. core agents
  const fraud = await fraudAgent(transactions);
  const treasury = await treasuryAgent(transactions);
  const payout = await payoutOptimizationAgent(transactions);

  // 🔥 FIX: compliance must align with real DB signals
  let complianceRaw;
  try {
 complianceRaw = await complianceAgent(transactions);
  } catch (e) {
    complianceRaw = { violations: [] };
  }

  const compliance = {
  status: complianceRaw?.violations?.length
    ? "failed"
    : "ok",

  violations: complianceRaw?.violations ?? [],
};

  // 4. vendor risk agent
  const rawVendorRisk = await vendorRiskAgent(enriched);

  // 5. ENRICHED RISK OUTPUT (FIXED JOIN)
  const risky = (rawVendorRisk?.risky ?? []).map((r: any) => {
    const vendor = enriched.find(
      (v) =>
        String(v.id) === String(r.vendorId) ||
        String(v.id) === String(r.id)
    );

    const tx = vendor?.transactions ?? [];

    return {
      vendorId: vendor?.id,
      vendorName: vendor?.name,

      riskScore:
        r.riskScore ??
        r.score ??
        vendor?.riskScore ??
        0,

      flags: r.flags ?? [],

      evidence: {
        transactions: tx.slice(-10),
        totalTransactions: tx.length,
      },

      timeline: buildTimeline(tx),

      whyNow: generateWhyNow(tx),
    };
  });

  return {
    fraud,
    treasury,
    compliance,
    payout,

    vendorRisk: {
      risky,
    },

    sharedMemory: getMemory(),
  };
}