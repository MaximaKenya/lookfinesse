import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { convertCurrency } from "@/lib/fx/fxEngine";

/**
 * Admin-gated FX convert that also persists conversion history when table exists.
 */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db, user } = gate.ctx;

  try {
    const body = await req.json();
    const amount = Number(body.amount ?? 0);
    const from = String(body.from ?? "USD").toUpperCase();
    const to = String(body.to ?? "KES").toUpperCase();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "amount required" }, { status: 400 });
    }

    // Prefer DB rate when present
    let rate: number | null = null;
    const pair = `${from}_${to}`;
    const { data: rateRow } = await db
      .from("fx_rates")
      .select("rate")
      .eq("pair", pair)
      .maybeSingle();
    if (rateRow?.rate != null) rate = Number(rateRow.rate);

    let converted: number;
    if (rate != null) {
      converted = Number((amount * rate).toFixed(2));
    } else {
      converted = convertCurrency({ amount, from, to });
      rate =
        from === to
          ? 1
          : Number((converted / amount).toFixed(6));
    }

    const { data: inserted } = await db
      .from("fx_conversions")
      .insert({
        amount,
        from_currency: from,
        to_currency: to,
        rate,
        converted_amount: converted,
        actor_id: user.id,
        metadata: { source: "admin_fx_console" },
      })
      .select("id")
      .maybeSingle();

    return NextResponse.json({
      converted,
      rate,
      pair,
      conversionId: inserted?.id ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "FX convert failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
