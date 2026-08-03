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
      { data: batches },
      { data: queue },
      { data: payouts },
      { data: pools },
    ] = await Promise.all([
      db
        .from("settlement_batches")
        .select(
          "id, total_amount, payout_count, status, rail, currency, metadata, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("payout_queue")
        .select("id, vendor_id, amount, status, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      db.from("payouts").select("id, amount, status, method, created_at"),
      db
        .from("liquidity_pools")
        .select("id, name, currency, balance, target_balance, status"),
    ]);

    const batchList = batches ?? [];
    const queueList = queue ?? [];
    const payoutList = payouts ?? [];
    const poolList = pools ?? [];

    const pendingBatches = batchList.filter((b) =>
      ["PENDING", "pending", "PROCESSING"].includes(String(b.status))
    );
    const settledBatches = batchList.filter((b) =>
      ["SETTLED", "settled", "COMPLETED", "completed"].includes(String(b.status))
    );
    const networkVolume = batchList.reduce(
      (s, b) => s + Number(b.total_amount ?? 0),
      0
    );
    const floatBalance = poolList.reduce(
      (s, p) => s + Number(p.balance ?? 0),
      0
    );

    const dayMap = new Map<string, { day: string; volume: number; count: number }>();
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { day: key.slice(5), volume: 0, count: 0 });
    }
    for (const b of batchList) {
      const key = String(b.created_at ?? "").slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket) continue;
      bucket.volume += Number(b.total_amount ?? 0);
      bucket.count += 1;
    }

    const railBreakdown = ["mpesa", "card", "bank", "stripe"].map((rail) => {
      const matches = payoutList.filter(
        (p) => String(p.method ?? "").toLowerCase() === rail
      );
      return {
        rail,
        count: matches.length,
        amount: matches.reduce((s, p) => s + Number(p.amount ?? 0), 0),
      };
    }).filter((r) => r.count > 0);

    const empty = batchList.length === 0 && queueList.length === 0;

    return NextResponse.json({
      empty,
      kpis: {
        batchCount: batchList.length,
        pendingBatches: pendingBatches.length,
        settledBatches: settledBatches.length,
        networkVolume,
        queueDepth: queueList.filter((q) =>
          ["queued", "QUEUED", "pending"].includes(String(q.status))
        ).length,
        floatBalance,
      },
      batches: batchList,
      queue: queueList,
      pools: poolList,
      series: Array.from(dayMap.values()),
      railBreakdown,
      seedHint: SEED_HINT,
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err) {
    console.error("[admin/network] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load network overview",
        empty: true,
        kpis: {
          batchCount: 0,
          pendingBatches: 0,
          settledBatches: 0,
          networkVolume: 0,
          queueDepth: 0,
          floatBalance: 0,
        },
        batches: [],
        queue: [],
        pools: [],
        series: [],
        railBreakdown: [],
        seedHint: SEED_HINT,
      },
      { status: 500 }
    );
  }
}
