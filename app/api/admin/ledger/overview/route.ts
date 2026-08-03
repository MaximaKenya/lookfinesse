import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

const SEED_HINT =
  "Run supabase/seed_demo_metrics.sql then supabase/seed_admin_finance.sql on the Heroku-linked Supabase project.";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  try {
    const { data: entries, error } = await db
      .from("ledger_entries")
      .select(
        "id, vendor_id, order_id, type, amount, category, description, status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) console.warn("[admin/ledger]", error.message);

    const list = entries ?? [];
    const credits = list.filter((e) => e.type === "credit");
    const debits = list.filter((e) => e.type === "debit");
    const feeTotal = list
      .filter((e) => e.category === "fee")
      .reduce((s, e) => s + Number(e.amount ?? 0), 0);
    const creditTotal = credits.reduce((s, e) => s + Number(e.amount ?? 0), 0);
    const debitTotal = debits.reduce((s, e) => s + Number(e.amount ?? 0), 0);

    const categoryMap = new Map<string, number>();
    for (const e of list) {
      const cat = String(e.category ?? "other");
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + Number(e.amount ?? 0));
    }
    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, amount]) => ({ category, amount })
    );

    const dayMap = new Map<string, { day: string; credit: number; debit: number }>();
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { day: key.slice(5), credit: 0, debit: 0 });
    }
    for (const e of list) {
      const key = String(e.created_at ?? "").slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket) continue;
      const amt = Number(e.amount ?? 0);
      if (e.type === "debit") bucket.debit += amt;
      else bucket.credit += amt;
    }

    return NextResponse.json({
      empty: list.length === 0,
      kpis: {
        entryCount: list.length,
        creditTotal,
        debitTotal,
        feeTotal,
        net: creditTotal - debitTotal,
      },
      entries: list,
      byCategory,
      series: Array.from(dayMap.values()),
      seedHint: SEED_HINT,
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err) {
    console.error("[admin/ledger] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load ledger",
        empty: true,
        kpis: {
          entryCount: 0,
          creditTotal: 0,
          debitTotal: 0,
          feeTotal: 0,
          net: 0,
        },
        entries: [],
        byCategory: [],
        series: [],
        seedHint: SEED_HINT,
      },
      { status: 500 }
    );
  }
}
