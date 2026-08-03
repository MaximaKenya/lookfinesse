import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

const SEED_HINT =
  "Run supabase/seed_demo_metrics.sql then supabase/seed_admin_finance.sql on the Heroku-linked Supabase project.";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  try {
    const [
      { data: vendors },
      { data: fraudEvents },
      { data: fraudLogs },
      { data: payouts },
      { data: queue },
    ] = await Promise.all([
      db
        .from("vendor_risk_scores")
        .select("vendor_id, risk_score, trust_tier, is_frozen, last_updated")
        .order("risk_score", { ascending: false }),
      db
        .from("fraud_events")
        .select("id, vendor_id, event_type, severity, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("fraud_logs")
        .select("id, vendor_id, event_type, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("payouts")
        .select("id, vendor_id, amount, status, created_at")
        .in("status", ["pending", "queued", "processing", "BLOCKED", "failed"])
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("payout_queue")
        .select("id, vendor_id, amount, status, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const vendorList = vendors ?? [];
    const events = (fraudEvents ?? []).map((f) => ({
      id: f.id,
      vendor_id: f.vendor_id,
      event_type: f.event_type,
      severity:
        typeof f.severity === "number"
          ? f.severity
          : String(f.severity ?? "MEDIUM"),
      reason:
        (f.metadata as { reason?: string } | null)?.reason ??
        f.event_type ??
        "Fraud event",
      created_at: f.created_at,
      source: "fraud_events" as const,
    }));
    const logs = (fraudLogs ?? []).map((f) => ({
      id: f.id,
      vendor_id: f.vendor_id,
      event_type: f.event_type,
      severity: "LOG",
      reason:
        (f.metadata as { reason?: string } | null)?.reason ??
        f.event_type ??
        "Fraud log",
      created_at: f.created_at,
      source: "fraud_logs" as const,
    }));
    const alerts = [...events, ...logs].sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
    );

    const highRisk = vendorList.filter((v) => Number(v.risk_score ?? 0) >= 70);
    const frozen = vendorList.filter((v) => v.is_frozen);
    const avgRisk =
      vendorList.length > 0
        ? Math.round(
            vendorList.reduce((s, v) => s + Number(v.risk_score ?? 0), 0) /
              vendorList.length
          )
        : 0;

    const riskBuckets = [
      {
        label: "Low",
        count: vendorList.filter((v) => Number(v.risk_score ?? 0) < 40).length,
      },
      {
        label: "Medium",
        count: vendorList.filter((v) => {
          const s = Number(v.risk_score ?? 0);
          return s >= 40 && s < 70;
        }).length,
      },
      {
        label: "High",
        count: vendorList.filter((v) => Number(v.risk_score ?? 0) >= 70).length,
      },
    ];

    const empty =
      vendorList.length === 0 &&
      alerts.length === 0 &&
      (payouts ?? []).length === 0;

    return NextResponse.json({
      empty,
      kpis: {
        vendorCount: vendorList.length,
        highRiskCount: highRisk.length,
        frozenCount: frozen.length,
        alertCount: alerts.length,
        avgRisk,
        queueDepth: (queue ?? []).length,
        watchedPayouts: (payouts ?? []).length,
      },
      vendors: vendorList,
      fraud_events: alerts,
      payouts: payouts ?? [],
      queue: queue ?? [],
      riskBuckets,
      seedHint: SEED_HINT,
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err) {
    console.error("[admin/risk] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load risk overview",
        empty: true,
        kpis: {
          vendorCount: 0,
          highRiskCount: 0,
          frozenCount: 0,
          alertCount: 0,
          avgRisk: 0,
          queueDepth: 0,
          watchedPayouts: 0,
        },
        vendors: [],
        fraud_events: [],
        payouts: [],
        queue: [],
        riskBuckets: [],
        seedHint: SEED_HINT,
      },
      { status: 500 }
    );
  }
}
