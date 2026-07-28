import { LedgerEntry } from "@/types/intelligence";

export interface HeatPoint {
  zone: string;
  count: number;
  totalRisk: number;
  intensity: number;
}

export function buildFraudHeatmap(
  transactions: LedgerEntry[]
): HeatPoint[] {
  const zones = new Map<string, HeatPoint>();

  for (const txn of transactions) {
    const zone = txn.geo_location || "Unknown";

    if (!zones.has(zone)) {
      zones.set(zone, {
        zone,
        count: 0,
        totalRisk: 0,
        intensity: 0,
      });
    }

    const existing = zones.get(zone)!;

    existing.count += 1;
    existing.totalRisk += txn.risk_score || 0;
    existing.intensity =
      existing.totalRisk / existing.count;
  }

  return Array.from(zones.values()).sort(
    (a, b) => b.intensity - a.intensity
  );
}