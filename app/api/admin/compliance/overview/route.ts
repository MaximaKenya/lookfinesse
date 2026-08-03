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
      { data: amlAlerts },
      { data: auditLogs },
      { data: fraudEvents },
      { data: kycRows },
      { data: vendorKyc },
    ] = await Promise.all([
      db
        .from("aml_alerts")
        .select(
          "id, vendor_id, alert_type, severity, description, status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("compliance_audit_logs")
        .select("id, action, actor_id, entity_type, entity_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("fraud_events")
        .select("id, vendor_id, event_type, severity, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("kyc_verifications")
        .select("id, user_id, status, document_url, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("vendor_kyc")
        .select(
          "id, vendor_id, full_name, country, verification_status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const alerts = amlAlerts ?? [];
    const openAlerts = alerts.filter(
      (a) => !["resolved", "closed", "dismissed"].includes(String(a.status ?? "open").toLowerCase())
    );
    const critical = alerts.filter((a) => Number(a.severity ?? 0) >= 7);
    const pendingKyc =
      (kycRows ?? []).filter((k) =>
        ["pending", "PENDING", "submitted"].includes(String(k.status))
      ).length +
      (vendorKyc ?? []).filter((k) =>
        ["PENDING", "pending", "SUBMITTED"].includes(
          String(k.verification_status)
        )
      ).length;

    const severitySeries = [
      { label: "1-3", count: alerts.filter((a) => Number(a.severity) <= 3).length },
      {
        label: "4-6",
        count: alerts.filter((a) => {
          const s = Number(a.severity);
          return s >= 4 && s <= 6;
        }).length,
      },
      { label: "7-10", count: alerts.filter((a) => Number(a.severity) >= 7).length },
    ];

    const empty =
      alerts.length === 0 &&
      (auditLogs ?? []).length === 0 &&
      (fraudEvents ?? []).length === 0;

    return NextResponse.json({
      empty,
      kpis: {
        alertCount: alerts.length,
        openAlerts: openAlerts.length,
        criticalCount: critical.length,
        auditCount: (auditLogs ?? []).length,
        pendingKyc,
        fraudEventCount: (fraudEvents ?? []).length,
      },
      alerts,
      auditLogs: auditLogs ?? [],
      fraudEvents: fraudEvents ?? [],
      kyc: kycRows ?? [],
      vendorKyc: vendorKyc ?? [],
      severitySeries,
      seedHint: SEED_HINT,
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err) {
    console.error("[admin/compliance] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load compliance overview",
        empty: true,
        kpis: {
          alertCount: 0,
          openAlerts: 0,
          criticalCount: 0,
          auditCount: 0,
          pendingKyc: 0,
          fraudEventCount: 0,
        },
        alerts: [],
        auditLogs: [],
        fraudEvents: [],
        kyc: [],
        vendorKyc: [],
        severitySeries: [],
        seedHint: SEED_HINT,
      },
      { status: 500 }
    );
  }
}
