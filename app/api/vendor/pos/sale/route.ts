import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

function missing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message?.includes("pos_sales") && error.message.includes("does not exist"))
  );
}

/** Sync offline or online POS sales; decrements stock when product found. */
export async function GET(req: Request) {
  try {
    const vendorId = new URL(req.url).searchParams.get("vendor_id");
    if (!vendorId) return NextResponse.json({ error: "Missing vendor_id" }, { status: 400 });

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("pos_sales")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      if (missing(error)) return NextResponse.json({ sales: [], demo: true });
      return NextResponse.json({ sales: [], error: error.message });
    }
    return NextResponse.json({ sales: data ?? [] });
  } catch {
    return NextResponse.json({ sales: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sales = Array.isArray(body.sales) ? body.sales : [body];

    const supabase = await createSupabaseServer();
    const results: Array<{ client_sale_id?: string; ok: boolean; error?: string }> = [];

    for (const sale of sales) {
      const {
        vendor_id,
        client_sale_id,
        sku,
        product_id,
        qty = 1,
        unit_price = 0,
        payment_method = "cash",
        created_offline_at,
      } = sale;

      if (!vendor_id) {
        results.push({ client_sale_id, ok: false, error: "Missing vendor_id" });
        continue;
      }

      let resolvedProductId = product_id as string | undefined;
      if (!resolvedProductId && sku) {
        const { data: prod } = await supabase
          .from("products")
          .select("id, stock_quantity, stock, price")
          .eq("vendor_id", vendor_id)
          .ilike("sku", sku)
          .limit(1)
          .maybeSingle();
        if (prod) resolvedProductId = prod.id;
      }

      const total = Number(qty) * Number(unit_price);
      const row = {
        vendor_id,
        client_sale_id: client_sale_id || `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sku: sku || null,
        product_id: resolvedProductId || null,
        qty: Number(qty),
        unit_price: Number(unit_price),
        total_kes: total,
        payment_method,
        synced_at: new Date().toISOString(),
        created_offline_at: created_offline_at || null,
      };

      const { error } = await supabase.from("pos_sales").upsert(row, {
        onConflict: "vendor_id,client_sale_id",
      });

      if (error) {
        if (missing(error)) {
          results.push({ client_sale_id: row.client_sale_id, ok: true });
          continue;
        }
        results.push({ client_sale_id: row.client_sale_id, ok: false, error: error.message });
        continue;
      }

      if (resolvedProductId) {
        const { data: prod } = await supabase
          .from("products")
          .select("stock_quantity, stock")
          .eq("id", resolvedProductId)
          .maybeSingle();
        if (prod) {
          const current = Number(prod.stock_quantity ?? prod.stock ?? 0);
          const next = Math.max(0, current - Number(qty));
          await supabase
            .from("products")
            .update({ stock_quantity: next, stock: next })
            .eq("id", resolvedProductId);
        }
      }

      results.push({ client_sale_id: row.client_sale_id, ok: true });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "POS sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
