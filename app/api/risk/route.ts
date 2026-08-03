import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

import { computeRiskEngine } from "@/lib/intelligence/riskEngine";

import { buildFraudHeatmap } from "@/lib/intelligence/fraudHeatmap";

import { generateAIInsight } from "@/lib/intelligence/aiInsights";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  const { data: transactions } = await supabase
    .from("ledger_entries")
    .select("*")
    .limit(500);

  const risk = computeRiskEngine(
    transactions || []
  );

  const heatmap = buildFraudHeatmap(
    transactions || []
  );

  const insight = await generateAIInsight({
    risk,
    heatmap,
  });

  return NextResponse.json({
    risk,
    heatmap,
    insight,
  });
}