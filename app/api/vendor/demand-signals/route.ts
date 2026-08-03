import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { buildDemandSignals } from "@/lib/intelligence/demandSignals";

export async function GET(req: Request) {
  try {
    const vendorId = new URL(req.url).searchParams.get("vendor_id");
    if (!vendorId) {
      return NextResponse.json({ error: "Missing vendor_id", signals: [] }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, sku, price, stock_quantity, stock, view_count, sales_count, engagement_score")
      .eq("vendor_id", vendorId)
      .limit(100);

    let rows = products ?? [];
    if (error) {
      const retry = await supabase
        .from("products")
        .select("id, name, sku, price, stock")
        .eq("vendor_id", vendorId)
        .limit(100);
      rows = retry.data ?? [];
    }

    // Soft engagement proxy from feed_posts linked products when columns missing
    if (rows.length && rows.every((p) => p.engagement_score == null && p.view_count == null)) {
      try {
        const ids = rows.map((p) => p.id);
        const { data: posts } = await supabase
          .from("feed_posts")
          .select("product_id, view_count, engagement_score")
          .in("product_id", ids);
        const byProduct = new Map<string, { views: number; eng: number }>();
        for (const post of posts ?? []) {
          const pid = post.product_id as string;
          if (!pid) continue;
          const cur = byProduct.get(pid) ?? { views: 0, eng: 0 };
          cur.views += Number(post.view_count ?? 0);
          cur.eng += Number(post.engagement_score ?? 0);
          byProduct.set(pid, cur);
        }
        rows = rows.map((p) => {
          const m = byProduct.get(p.id);
          return m
            ? { ...p, view_count: m.views, engagement_score: m.eng }
            : p;
        });
      } catch {
        /* optional */
      }
    }

    const signals = buildDemandSignals(rows);

    // Persist best-effort
    try {
      if (signals.length && vendorId) {
        await supabase.from("demand_signals").delete().eq("vendor_id", vendorId);
        await supabase.from("demand_signals").insert(
          signals.slice(0, 8).map((s) => ({
            vendor_id: vendorId,
            product_id: s.product_id ?? null,
            signal_type: s.signal_type,
            title: s.title,
            rationale: s.rationale,
            score: s.score,
          }))
        );
      }
    } catch {
      /* table may not exist yet */
    }

    return NextResponse.json({ signals, product_count: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Demand signals failed";
    return NextResponse.json({
      signals: buildDemandSignals([]),
      error: message,
    });
  }
}
