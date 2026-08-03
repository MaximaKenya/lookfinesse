import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

const PENDING = new Set(["pending", "queued", "QUEUED", "RETRY_SCHEDULED"]);
const COMPLETED = new Set(["completed", "paid", "SENT", "sent"]);
const FAILED = new Set(["failed", "rejected", "FAILED", "BLOCKED"]);

/**
 * Admin payouts console — ledger-backed KPIs + payouts + queue.
 * Service-role when configured so RLS never zeroes the dashboard.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  try {
    const [
      { data: payouts, error: payoutErr },
      { data: queue, error: queueErr },
      { data: ledgerFees },
      { data: treasuryAccounts },
    ] = await Promise.all([
      db
        .from("payouts")
        .select("id, vendor_id, amount, status, method, phone, reference, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(200),
      db
        .from("payout_queue")
        .select("id, vendor_id, amount, status, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("ledger_entries")
        .select("amount, category, created_at")
        .eq("category", "fee")
        .order("created_at", { ascending: true })
        .limit(200),
      db.from("treasury_accounts").select("id, name, balance, currency"),
    ]);

    if (payoutErr) console.warn("[admin/payouts] payouts:", payoutErr.message);
    if (queueErr) console.warn("[admin/payouts] queue:", queueErr.message);

    const list = payouts ?? [];
    const queueList = queue ?? [];

    const pending = list.filter((p) => PENDING.has(String(p.status)));
    const completed = list.filter((p) => COMPLETED.has(String(p.status)));
    const failed = list.filter((p) => FAILED.has(String(p.status)));

    const sum = (rows: { amount?: number | null }[]) =>
      rows.reduce((s, r) => s + Number(r.amount ?? 0), 0);

    const pendingTotal = sum(pending);
    const disbursedTotal = sum(completed);
    const failedTotal = sum(failed);
    const allTotal = sum(list);
    const queueTotal = sum(queueList.filter((q) => PENDING.has(String(q.status))));
    const treasuryBalance = (treasuryAccounts ?? []).reduce(
      (s, a) => s + Number(a.balance ?? 0),
      0
    );

    // Daily volume series (last 14 days) for chart
    const dayMap = new Map<string, { day: string; volume: number; count: number }>();
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { day: key.slice(5), volume: 0, count: 0 });
    }
    for (const p of list) {
      const key = String(p.created_at ?? "").slice(0, 10);
      const bucket = dayMap.get(key);
      if (bucket) {
        bucket.volume += Number(p.amount ?? 0);
        bucket.count += 1;
      }
    }
    const series = Array.from(dayMap.values());

    const statusBreakdown = [
      { status: "pending", count: pending.length, amount: pendingTotal },
      { status: "completed", count: completed.length, amount: disbursedTotal },
      { status: "failed", count: failed.length, amount: failedTotal },
      {
        status: "other",
        count: list.length - pending.length - completed.length - failed.length,
        amount: allTotal - pendingTotal - disbursedTotal - failedTotal,
      },
    ].filter((s) => s.count > 0);

    const empty =
      list.length === 0 &&
      queueList.length === 0 &&
      (ledgerFees ?? []).length === 0;

    return NextResponse.json({
      empty,
      kpis: {
        pendingCount: pending.length,
        pendingTotal,
        disbursedTotal,
        failedTotal,
        allTotal,
        queueDepth: queueList.filter((q) => PENDING.has(String(q.status))).length,
        queueTotal,
        treasuryBalance,
        feeRevenue: (ledgerFees ?? []).reduce(
          (s, r) => s + Number(r.amount ?? 0),
          0
        ),
      },
      payouts: list,
      queue: queueList,
      series,
      statusBreakdown,
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      seedHint:
        "Run supabase/seed_demo_metrics.sql then supabase/seed_admin_finance.sql on the Heroku-linked Supabase project.",
    });
  } catch (err) {
    console.error("[admin/payouts] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load payouts",
        empty: true,
        kpis: {
          pendingCount: 0,
          pendingTotal: 0,
          disbursedTotal: 0,
          failedTotal: 0,
          allTotal: 0,
          queueDepth: 0,
          queueTotal: 0,
          treasuryBalance: 0,
          feeRevenue: 0,
        },
        payouts: [],
        queue: [],
        series: [],
        statusBreakdown: [],
      },
      { status: 500 }
    );
  }
}
