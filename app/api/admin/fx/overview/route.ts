import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { FX_RATES } from "@/lib/fx/fxRates";

const SEED_HINT =
  "Run supabase/seed_demo_metrics.sql then supabase/seed_admin_finance.sql on the Heroku-linked Supabase project.";

/**
 * Admin FX console — rates + conversion history from DB (fallback static rates).
 */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  try {
    const [{ data: rateRows }, { data: conversions }, { data: treasury }] =
      await Promise.all([
        db
          .from("fx_rates")
          .select("id, pair, rate, base_currency, quote_currency, updated_at")
          .order("pair"),
        db
          .from("fx_conversions")
          .select(
            "id, amount, from_currency, to_currency, rate, converted_amount, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(100),
        db.from("treasury_accounts").select("id, name, currency, balance"),
      ]);

    const dbRates = (rateRows ?? []).map((r) => ({
      id: r.id,
      pair: r.pair as string,
      rate: Number(r.rate ?? 0),
      base: (r.base_currency as string) ?? r.pair?.split("_")[0],
      quote: (r.quote_currency as string) ?? r.pair?.split("_")[1],
      updated_at: r.updated_at as string | undefined,
      source: "db" as const,
    }));

    const staticRates =
      dbRates.length === 0
        ? Object.entries(FX_RATES).map(([pair, rate]) => {
            const [base, quote] = pair.split("_");
            return {
              id: pair,
              pair,
              rate,
              base,
              quote,
              updated_at: undefined as string | undefined,
              source: "static" as const,
            };
          })
        : [];

    const rates = dbRates.length > 0 ? dbRates : staticRates;
    const conversionList = conversions ?? [];

    const dayMap = new Map<string, { day: string; volume: number; count: number }>();
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { day: key.slice(5), volume: 0, count: 0 });
    }
    for (const c of conversionList) {
      const key = String(c.created_at ?? "").slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket) continue;
      bucket.volume += Number(c.converted_amount ?? c.amount ?? 0);
      bucket.count += 1;
    }

    const usdKes = rates.find((r) => r.pair === "USD_KES")?.rate ?? FX_RATES.USD_KES;
    const treasuryFxExposure = (treasury ?? [])
      .filter((t) => String(t.currency) !== "KES")
      .reduce((s, t) => {
        const bal = Number(t.balance ?? 0);
        const cur = String(t.currency ?? "USD");
        const pair = `${cur}_KES`;
        const rate =
          rates.find((r) => r.pair === pair)?.rate ?? FX_RATES[pair] ?? 0;
        return s + bal * rate;
      }, 0);

    const empty = conversionList.length === 0 && dbRates.length === 0;

    return NextResponse.json({
      empty,
      kpis: {
        pairCount: rates.length,
        conversionCount: conversionList.length,
        usdKes,
        treasuryFxExposure: Math.round(treasuryFxExposure),
        last24hVolume: conversionList
          .filter(
            (c) =>
              new Date(c.created_at ?? 0).getTime() > Date.now() - 86400000
          )
          .reduce((s, c) => s + Number(c.converted_amount ?? 0), 0),
      },
      rates,
      conversions: conversionList,
      series: Array.from(dayMap.values()),
      seedHint: SEED_HINT,
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err) {
    console.error("[admin/fx] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load FX overview",
        empty: true,
        kpis: {
          pairCount: 0,
          conversionCount: 0,
          usdKes: FX_RATES.USD_KES,
          treasuryFxExposure: 0,
          last24hVolume: 0,
        },
        rates: [],
        conversions: [],
        series: [],
        seedHint: SEED_HINT,
      },
      { status: 500 }
    );
  }
}
