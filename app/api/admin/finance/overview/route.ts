import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

/**
 * Platform finance KPIs for /admin/finance.
 * Uses service-role when available so RLS never zeroes production dashboards.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  try {
    const [
      { data: feeRows, error: feeErr },
      { data: saleRows, error: saleErr },
      { data: payouts, error: payoutErr },
      { data: fraudLogs, error: fraudErr },
      { data: fraudEvents },
      { data: treasuryAccounts },
    ] = await Promise.all([
      db.from("ledger_entries").select("amount, category, created_at").eq("category", "fee"),
      db.from("ledger_entries").select("amount, category, created_at").eq("category", "sale"),
      db.from("payouts").select("id, amount, status, vendor_id, created_at"),
      db
        .from("fraud_logs")
        .select("id, event_type, metadata, vendor_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("fraud_events")
        .select("id, event_type, severity, metadata, vendor_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      db.from("treasury_accounts").select("id, name, currency, balance"),
    ]);

    if (feeErr) console.warn("[admin/finance] fee query:", feeErr.message);
    if (saleErr) console.warn("[admin/finance] sale query:", saleErr.message);
    if (payoutErr) console.warn("[admin/finance] payouts query:", payoutErr.message);
    if (fraudErr) console.warn("[admin/finance] fraud_logs query:", fraudErr.message);

    const feeRevenue =
      feeRows?.reduce((sum, i) => sum + Number(i.amount ?? 0), 0) || 0;
    // Platform revenue = fees; if no fee rows yet, derive ~10% of sales (seed/compat)
    const saleTotal =
      saleRows?.reduce((sum, i) => sum + Number(i.amount ?? 0), 0) || 0;
    const revenue = feeRevenue > 0 ? feeRevenue : Math.round(saleTotal * 0.1);

    const totalPayouts =
      payouts?.reduce((sum, p) => sum + Number(p.amount ?? 0), 0) || 0;
    const pendingPayouts =
      payouts?.filter((p) => p.status === "pending" || p.status === "queued") ||
      [];

    const fraudFromLogs = (fraudLogs ?? []).map((f) => ({
      id: f.id,
      reason:
        (f.metadata as { reason?: string } | null)?.reason ??
        f.event_type ??
        "Suspicious activity",
      amount: Number((f.metadata as { amount?: number } | null)?.amount ?? 0) || undefined,
      created_at: f.created_at,
    }));

    const fraudFromEvents = (fraudEvents ?? []).map((f) => ({
      id: f.id,
      reason:
        (f.metadata as { reason?: string } | null)?.reason ??
        f.event_type ??
        f.severity ??
        "Fraud event",
      amount: Number((f.metadata as { amount?: number } | null)?.amount ?? 0) || undefined,
      created_at: f.created_at,
    }));

    const fraud = [...fraudFromLogs, ...fraudFromEvents]
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      )
      .slice(0, 50);

    const treasuryBalance =
      treasuryAccounts?.reduce((sum, a) => sum + Number(a.balance ?? 0), 0) || 0;

    return NextResponse.json({
      revenue,
      feeRevenue,
      saleTotal,
      payouts: totalPayouts,
      pendingPayouts,
      fraud,
      treasuryBalance,
      treasuryAccounts: treasuryAccounts ?? [],
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err) {
    console.error("[admin/finance] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load admin finance",
        revenue: 0,
        payouts: 0,
        pendingPayouts: [],
        fraud: [],
        treasuryBalance: 0,
      },
      { status: 500 }
    );
  }
}
