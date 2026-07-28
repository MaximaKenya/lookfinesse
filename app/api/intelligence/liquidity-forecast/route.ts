import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data: credits } = await supabase
    .from("ledger_entries")
    .select("amount, created_at")
    .eq("type", "credit")
    .order("created_at", { ascending: false })
    .limit(60);

  const dailyTotals = new Map<string, number>();

  for (const row of credits ?? []) {
    if (!row.created_at) continue;
    const day = row.created_at.slice(0, 10);
    dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + Number(row.amount ?? 0));
  }

  const sortedDays = Array.from(dailyTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14);

  const points =
    sortedDays.length > 0
      ? sortedDays.map(([, total]) => Math.max(0, Math.round(total)))
      : Array.from({ length: 14 }, () => 0);

  const avg =
    points.length > 0
      ? points.reduce((sum, v) => sum + v, 0) / points.length
      : 0;

  const trend =
    points.length >= 2 && points[points.length - 1] > points[points.length - 2]
      ? "up"
      : points.length >= 2 && points[points.length - 1] < points[points.length - 2]
        ? "down"
        : "flat";

  const confidence =
    sortedDays.length >= 7
      ? Math.min(95, 60 + sortedDays.length * 3)
      : sortedDays.length > 0
        ? 40 + sortedDays.length * 5
        : 0;

  return NextResponse.json({
    points,
    empty: sortedDays.length === 0,
    avg: Math.round(avg),
    trend,
    confidence,
  });
}
