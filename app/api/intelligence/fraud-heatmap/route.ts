import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";
import { buildFraudHeatmap } from "@/lib/intelligence/fraudHeatmap";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  const { data: transactions, error } = await supabase
    .from("ledger_entries")
    .select("geo_location, risk_score, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: "Failed to load fraud heatmap" }, { status: 500 });
  }

  const heatmap = buildFraudHeatmap(transactions ?? []);

  const rows = 7;
  const cols = 24;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0)
  );

  for (const txn of transactions ?? []) {
    if (!txn.created_at) continue;
    const date = new Date(txn.created_at);
    const day = date.getDay();
    const hour = date.getHours();
    matrix[day][hour] += Number(txn.risk_score ?? 0);
  }

  const maxCell = Math.max(...matrix.flat(), 1);

  const normalizedMatrix = matrix.map((row) =>
    row.map((cell) => Math.round((cell / maxCell) * 100))
  );

  return NextResponse.json({
    cells: normalizedMatrix.flat(),
    matrix: normalizedMatrix,
    zones: heatmap,
    empty: (transactions ?? []).length === 0,
  });
}
