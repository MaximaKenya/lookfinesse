import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

/**
 * Admin treasury console — accounts, liquidity pools, forecasts, ledger pulse.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  try {
    const [
      { data: accounts, error: accErr },
      { data: pools, error: poolErr },
      { data: forecasts, error: fcErr },
      { data: ledger },
      { data: pendingPayouts },
    ] = await Promise.all([
      db
        .from("treasury_accounts")
        .select("id, name, currency, balance, account_type, updated_at, created_at")
        .order("balance", { ascending: false }),
      db
        .from("liquidity_pools")
        .select("id, name, currency, balance, target_balance, status, updated_at, created_at")
        .order("balance", { ascending: false }),
      db
        .from("payout_forecasts")
        .select(
          "id, currency, forecast_amount, horizon_days, confidence, metadata, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(20),
      db
        .from("ledger_entries")
        .select("amount, category, type, created_at")
        .order("created_at", { ascending: true })
        .limit(300),
      db
        .from("payouts")
        .select("id, amount, status")
        .in("status", ["pending", "queued"]),
    ]);

    if (accErr) console.warn("[admin/treasury] accounts:", accErr.message);
    if (poolErr) console.warn("[admin/treasury] pools:", poolErr.message);
    if (fcErr) console.warn("[admin/treasury] forecasts:", fcErr.message);

    const accountList = accounts ?? [];
    const poolList = pools ?? [];
    const forecastList = forecasts ?? [];

    const totalTreasury = accountList.reduce(
      (s, a) => s + Number(a.balance ?? 0),
      0
    );
    const totalLiquidity = poolList.reduce(
      (s, p) => s + Number(p.balance ?? 0),
      0
    );
    const targetLiquidity = poolList.reduce(
      (s, p) => s + Number(p.target_balance ?? 0),
      0
    );
    const pendingOutflow = (pendingPayouts ?? []).reduce(
      (s, p) => s + Number(p.amount ?? 0),
      0
    );
    const nextForecast = forecastList[0]
      ? Number(forecastList[0].forecast_amount ?? 0)
      : 0;
    const coverage =
      nextForecast > 0
        ? Math.round(((totalTreasury + totalLiquidity) / nextForecast) * 100)
        : null;

    // 14-day ledger pulse (credits vs debits)
    const dayMap = new Map<
      string,
      { day: string; inflow: number; outflow: number }
    >();
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { day: key.slice(5), inflow: 0, outflow: 0 });
    }
    for (const row of ledger ?? []) {
      const key = String(row.created_at ?? "").slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket) continue;
      const amt = Number(row.amount ?? 0);
      if (row.type === "debit") bucket.outflow += amt;
      else bucket.inflow += amt;
    }
    const series = Array.from(dayMap.values());

    const accountBreakdown = accountList.map((a) => ({
      name: a.name ?? "Account",
      balance: Number(a.balance ?? 0),
      currency: a.currency ?? "KES",
      type: a.account_type ?? "operating",
    }));

    const poolHealth = poolList.map((p) => {
      const bal = Number(p.balance ?? 0);
      const target = Number(p.target_balance ?? 0);
      const pct = target > 0 ? Math.min(100, Math.round((bal / target) * 100)) : 100;
      return {
        id: p.id,
        name: p.name,
        balance: bal,
        target,
        pct,
        status: p.status ?? "active",
        currency: p.currency ?? "KES",
      };
    });

    const empty =
      accountList.length === 0 &&
      poolList.length === 0 &&
      forecastList.length === 0;

    return NextResponse.json({
      empty,
      kpis: {
        totalTreasury,
        totalLiquidity,
        targetLiquidity,
        pendingOutflow,
        nextForecast,
        coverage,
        accountCount: accountList.length,
        poolCount: poolList.length,
      },
      accounts: accountList,
      pools: poolList,
      forecasts: forecastList,
      accountBreakdown,
      poolHealth,
      series,
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      seedHint:
        "Run supabase/seed_demo_metrics.sql then supabase/seed_admin_finance.sql on the Heroku-linked Supabase project.",
    });
  } catch (err) {
    console.error("[admin/treasury] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load treasury",
        empty: true,
        kpis: {
          totalTreasury: 0,
          totalLiquidity: 0,
          targetLiquidity: 0,
          pendingOutflow: 0,
          nextForecast: 0,
          coverage: null,
          accountCount: 0,
          poolCount: 0,
        },
        accounts: [],
        pools: [],
        forecasts: [],
        accountBreakdown: [],
        poolHealth: [],
        series: [],
      },
      { status: 500 }
    );
  }
}
