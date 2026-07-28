import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data: ledger, error } = await supabase
    .from("ledger_entries")
    .select("geo_location, amount, risk_score, type")
    .limit(500);

  if (error) {
    return NextResponse.json({ regions: [], empty: true }, { status: 500 });
  }

  const zones = new Map<
    string,
    { exposure: number; riskSum: number; count: number }
  >();

  for (const row of ledger ?? []) {
    const region = row.geo_location ?? "Unknown";
    const existing = zones.get(region) ?? {
      exposure: 0,
      riskSum: 0,
      count: 0,
    };
    existing.exposure += Number(row.amount ?? 0);
    existing.riskSum += Number(row.risk_score ?? 0);
    existing.count += 1;
    zones.set(region, existing);
  }

  const regions = Array.from(zones.entries())
    .map(([region, stats]) => {
      const avgRisk = stats.count > 0 ? stats.riskSum / stats.count : 0;
      const risk =
        avgRisk >= 70 ? "HIGH" : avgRisk >= 40 ? "MODERATE" : "LOW";
      const color =
        risk === "HIGH"
          ? "text-red-400"
          : risk === "MODERATE"
            ? "text-yellow-400"
            : "text-green-400";

      return {
        region,
        risk,
        exposure: stats.exposure,
        exposureLabel: `KES ${Math.round(stats.exposure).toLocaleString()}`,
        color,
      };
    })
    .sort((a, b) => b.exposure - a.exposure)
    .slice(0, 10);

  return NextResponse.json({
    regions,
    empty: regions.length === 0,
  });
}
