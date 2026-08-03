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
      { data: payments },
      { data: fees },
      { data: payouts },
      { data: orders },
    ] = await Promise.all([
      db
        .from("payments")
        .select("id, amount, status, provider, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      db.from("ledger_entries").select("amount, category, created_at").eq("category", "fee"),
      db.from("payouts").select("id, amount, status, created_at"),
      db.from("orders").select("id, status, total, created_at").limit(500),
    ]);

    const paymentList = payments ?? [];
    const paid = paymentList.filter((p) =>
      ["paid", "completed", "success"].includes(String(p.status))
    );
    const revenue = paid.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const feeRevenue = (fees ?? []).reduce(
      (s, f) => s + Number(f.amount ?? 0),
      0
    );
    const payoutTotal = (payouts ?? []).reduce(
      (s, p) => s + Number(p.amount ?? 0),
      0
    );

    const dayMap = new Map<string, { day: string; revenue: number; count: number }>();
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { day: key.slice(5), revenue: 0, count: 0 });
    }
    for (const p of paid) {
      const key = String(p.created_at ?? "").slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket) continue;
      bucket.revenue += Number(p.amount ?? 0);
      bucket.count += 1;
    }

    const providerMap = new Map<string, { provider: string; amount: number; count: number }>();
    for (const p of paid) {
      const provider = String(p.provider ?? "unknown");
      const cur = providerMap.get(provider) ?? {
        provider,
        amount: 0,
        count: 0,
      };
      cur.amount += Number(p.amount ?? 0);
      cur.count += 1;
      providerMap.set(provider, cur);
    }

    return NextResponse.json({
      empty: paymentList.length === 0 && (fees ?? []).length === 0,
      kpis: {
        revenue,
        feeRevenue,
        orderCount: (orders ?? []).length,
        paymentCount: paid.length,
        payoutTotal,
        avgTicket: paid.length > 0 ? Math.round(revenue / paid.length) : 0,
      },
      series: Array.from(dayMap.values()),
      byProvider: Array.from(providerMap.values()),
      seedHint: SEED_HINT,
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err) {
    console.error("[admin/analytics] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load analytics",
        empty: true,
        kpis: {
          revenue: 0,
          feeRevenue: 0,
          orderCount: 0,
          paymentCount: 0,
          payoutTotal: 0,
          avgTicket: 0,
        },
        series: [],
        byProvider: [],
        seedHint: SEED_HINT,
      },
      { status: 500 }
    );
  }
}
