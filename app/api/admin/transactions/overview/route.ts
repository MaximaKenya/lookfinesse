import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

const SEED_HINT =
  "Run supabase/seed_demo_metrics.sql then supabase/seed_admin_finance.sql on the Heroku-linked Supabase project.";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  try {
    const { data: payments, error } = await db
      .from("payments")
      .select(
        "id, order_id, vendor_id, provider, status, amount, phone, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) console.warn("[admin/transactions]", error.message);

    const list = payments ?? [];
    const paid = list.filter((p) =>
      ["paid", "completed", "success"].includes(String(p.status))
    );
    const pending = list.filter((p) =>
      ["pending", "processing", "initiated"].includes(String(p.status))
    );
    const failed = list.filter((p) =>
      ["failed", "cancelled", "expired"].includes(String(p.status))
    );

    const statusBreakdown = [
      {
        status: "paid",
        count: paid.length,
        amount: paid.reduce((s, p) => s + Number(p.amount ?? 0), 0),
      },
      {
        status: "pending",
        count: pending.length,
        amount: pending.reduce((s, p) => s + Number(p.amount ?? 0), 0),
      },
      {
        status: "failed",
        count: failed.length,
        amount: failed.reduce((s, p) => s + Number(p.amount ?? 0), 0),
      },
    ].filter((s) => s.count > 0);

    return NextResponse.json({
      empty: list.length === 0,
      kpis: {
        total: list.length,
        paidCount: paid.length,
        paidVolume: paid.reduce((s, p) => s + Number(p.amount ?? 0), 0),
        pendingCount: pending.length,
        failedCount: failed.length,
      },
      payments: list,
      statusBreakdown,
      seedHint: SEED_HINT,
      source: "db",
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err) {
    console.error("[admin/transactions] overview failed", err);
    return NextResponse.json(
      {
        error: "Failed to load transactions",
        empty: true,
        kpis: {
          total: 0,
          paidCount: 0,
          paidVolume: 0,
          pendingCount: 0,
          failedCount: 0,
        },
        payments: [],
        statusBreakdown: [],
        seedHint: SEED_HINT,
      },
      { status: 500 }
    );
  }
}
