import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

import { buildExecutiveInsights } from "@/lib/admin/buildExecutiveInsights";

export async function GET() {
  try {
    /**
     * LEDGER
     */
    const { data: ledger } = await supabase
      .from("ledger_entries")
      .select("*");

    /**
     * EVENTS
     */
    const { data: events } = await supabase
      .from("financial_events")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(30);

    const revenueToday =
      ledger
        ?.filter(
          (e) =>
            e.type === "credit"
        )
        .reduce(
          (sum, e) =>
            sum + Number(e.amount || 0),
          0
        ) || 0;

    const payouts =
      ledger
        ?.filter(
          (e) =>
            e.category === "payout"
        )
        .reduce(
          (sum, e) =>
            sum + Number(e.amount || 0),
          0
        ) || 0;

    const suspiciousTransactions =
      ledger?.filter(
        (e) =>
          e.risk_score &&
          e.risk_score > 70
      ).length || 0;

    const pendingPayouts =
      ledger?.filter(
        (e) =>
          e.category === "payout" &&
          e.status === "pending"
      ).length || 0;

    const liquidityRatio =
      revenueToday > 0
        ? Math.max(
            10,
            Math.min(
              100,
              Math.round(
                (payouts /
                  revenueToday) *
                  100
              )
            )
          )
        : 100;

    const insights =
      buildExecutiveInsights({
        suspiciousTransactions,
        pendingPayouts,
        liquidityRatio,
        revenueToday,
      });

    return NextResponse.json({
      metrics: {
        revenueToday,
        payouts,
        suspiciousTransactions,
        liquidityRatio,
      },

      insights,

      systems: [
        {
          label: "Treasury Engine",
          status: "Operational",
          health: "healthy",
        },
        {
          label: "Fraud Detection",
          status:
            suspiciousTransactions > 5
              ? "Alerting"
              : "Monitoring",
          health:
            suspiciousTransactions > 5
              ? "warning"
              : "healthy",
        },
        {
          label: "Realtime Streams",
          status: "Connected",
          health: "healthy",
        },
        {
          label: "AI Copilot",
          status: "Active",
          health: "healthy",
        },
      ],

      events: events || [],
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          "Failed to load admin intelligence",
      },
      {
        status: 500,
      }
    );
  }
}