import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

import { computeRiskEngine } from "@/lib/intelligence/riskEngine";

import { buildFraudHeatmap } from "@/lib/intelligence/fraudHeatmap";

import { generateAIInsight } from "@/lib/intelligence/aiInsights";

import { LedgerEntry } from "@/types/system";
import { requireAdmin } from "@/lib/auth/requireAdmin";


export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  try {
    console.log(
      "🚀 Risk radar route started"
    );

    // FETCH TRANSACTIONS
    const {
      data: transactions,
      error,
    } = await supabase
      .from("ledger_entries")
      .select("*")
      .limit(500);

    if (error) {
      console.error(
        "SUPABASE ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Failed to fetch transactions",
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "✅ Transactions fetched:",
      transactions?.length
    );

    // COMPUTE RISK
    const risk = computeRiskEngine(
      transactions || []
    );

    console.log(
      "✅ Risk engine complete"
    );

    // BUILD HEATMAP
    const heatmap =
      buildFraudHeatmap(
        transactions || []
      );

    console.log(
      "✅ Heatmap built"
    );

    // DEFAULT AI FALLBACK
    let insight =
      "AI insight temporarily unavailable";

    // SAFE AI EXECUTION
    try {
      console.log(
        "🧠 Generating AI insight..."
      );

      insight =
        (await generateAIInsight({
          risk,
          heatmap,
        })) || insight;

      console.log(
        "✅ AI insight generated"
      );
    } catch (aiError: any) {
      console.error(
        "OPENAI ERROR:",
        aiError
      );
    }

    return NextResponse.json({
      success: true,

      risk,

      heatmap,

      insight,
    });
  } catch (err: any) {
    console.error(
      "💥 RISK RADAR FATAL ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,

        error:
          err.message ||
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}