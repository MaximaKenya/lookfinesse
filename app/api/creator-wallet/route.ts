import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

function missing(error: { code?: string; message?: string } | null, table: string) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message?.includes(table) && error.message.includes("does not exist"))
  );
}

/** Unified creator wallet: tips + affiliate commissions + brand deals + CSV export. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const vendorId = searchParams.get("vendor_id");
    const format = searchParams.get("format");

    if (!userId && !vendorId) {
      return NextResponse.json({ error: "Missing user_id or vendor_id" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    let ledger: Array<Record<string, unknown>> = [];

    let q = supabase
      .from("creator_wallet_ledger")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (userId) q = q.eq("user_id", userId);
    if (vendorId) q = q.eq("vendor_id", vendorId);

    const { data, error } = await q;
    if (error && !missing(error, "creator_wallet_ledger")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    ledger = data ?? [];

    // Synthesize from affiliate_links + live_tips when ledger empty
    if (ledger.length === 0 && vendorId) {
      const [{ data: links }, { data: tips }] = await Promise.all([
        supabase.from("affiliate_links").select("id, code, clicks, conversions, commission_rate").eq("vendor_id", vendorId),
        supabase.from("live_tips").select("id, amount, created_at, from_user_id").eq("vendor_id", vendorId).limit(50),
      ]);

      for (const tip of tips ?? []) {
        ledger.push({
          id: `tip-${tip.id}`,
          source: "tip",
          amount_kes: Number(tip.amount ?? 0),
          description: "Live tip",
          created_at: tip.created_at,
          tax_category: "tip",
        });
      }

      for (const link of links ?? []) {
        const conversions = Number(link.conversions ?? 0);
        const rate = Number(link.commission_rate ?? 0.05);
        if (conversions > 0) {
          ledger.push({
            id: `aff-${link.id}`,
            source: "affiliate",
            amount_kes: Number((conversions * 500 * rate).toFixed(2)),
            description: `Affiliate ${link.code} · ${conversions} conversions (est.)`,
            created_at: new Date().toISOString(),
            tax_category: "commission",
          });
        }
      }
    }

    if (ledger.length === 0) {
      ledger = [
        {
          id: "demo-1",
          source: "tip",
          amount_kes: 200,
          description: "Demo tip — seed real activity to replace",
          created_at: new Date().toISOString(),
          tax_category: "tip",
        },
        {
          id: "demo-2",
          source: "affiliate",
          amount_kes: 750,
          description: "Demo affiliate commission",
          created_at: new Date().toISOString(),
          tax_category: "commission",
        },
      ];
    }

    const totals = {
      tips: 0,
      affiliate: 0,
      brand_deal: 0,
      payout: 0,
      other: 0,
      available: 0,
    };

    for (const row of ledger) {
      const amt = Number(row.amount_kes ?? 0);
      const src = String(row.source ?? "other");
      if (src === "tip") totals.tips += amt;
      else if (src === "affiliate") totals.affiliate += amt;
      else if (src === "brand_deal") totals.brand_deal += amt;
      else if (src === "payout") totals.payout += amt;
      else totals.other += amt;
    }
    totals.available = totals.tips + totals.affiliate + totals.brand_deal + totals.other - Math.abs(totals.payout);

    if (format === "csv") {
      const header = "date,source,amount_kes,tax_category,description,reference_id\n";
      const lines = ledger.map((r) =>
        [
          r.created_at ?? "",
          r.source ?? "",
          r.amount_kes ?? 0,
          r.tax_category ?? "",
          `"${String(r.description ?? "").replace(/"/g, '""')}"`,
          r.reference_id ?? "",
        ].join(",")
      );
      return new NextResponse(header + lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="creator-wallet.csv"',
        },
      });
    }

    return NextResponse.json({ ledger, totals, currency: "KES" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Wallet failed";
    return NextResponse.json({ error: message, ledger: [], totals: {} }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, vendor_id, source, amount_kes, description, reference_id, tax_category } = body;
    if (!user_id || !source || amount_kes == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("creator_wallet_ledger")
      .insert({
        user_id,
        vendor_id: vendor_id || null,
        source,
        amount_kes,
        description: description || null,
        reference_id: reference_id || null,
        tax_category: tax_category || "commission",
      })
      .select("*")
      .single();

    if (error) {
      if (missing(error, "creator_wallet_ledger")) {
        return NextResponse.json({ ok: true, demo: true, entry: body });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, entry: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Insert failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
