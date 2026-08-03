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

/** Lookup product by SKU and optionally adjust stock (receive / count / pick). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sku = searchParams.get("sku")?.trim();
    const vendorId = searchParams.get("vendor_id");
    if (!sku) return NextResponse.json({ error: "Missing sku" }, { status: 400 });

    const supabase = await createSupabaseServer();
    let q = supabase
      .from("products")
      .select("id, name, sku, price, stock_quantity, stock, image_url, vendor_id, store_id")
      .ilike("sku", sku)
      .limit(5);

    if (vendorId) q = q.eq("vendor_id", vendorId);

    const { data, error } = await q;
    if (error) {
      // try without stock_quantity column
      const retry = await supabase
        .from("products")
        .select("id, name, sku, price, image_url, vendor_id")
        .ilike("sku", sku)
        .limit(5);
      if (retry.error) return NextResponse.json({ error: retry.error.message, products: [] }, { status: 200 });
      return NextResponse.json({ products: retry.data ?? [] });
    }

    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message, products: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, delta, mode, vendor_id } = body as {
      product_id?: string;
      delta?: number;
      mode?: "receive" | "count" | "pick";
      vendor_id?: string;
    };

    if (!product_id || typeof delta !== "number") {
      return NextResponse.json({ error: "Missing product_id or delta" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: product, error: fetchErr } = await supabase
      .from("products")
      .select("id, stock_quantity, stock, vendor_id")
      .eq("id", product_id)
      .maybeSingle();

    if (fetchErr || !product) {
      return NextResponse.json({ error: fetchErr?.message ?? "Product not found" }, { status: 404 });
    }

    if (vendor_id && product.vendor_id && product.vendor_id !== vendor_id) {
      return NextResponse.json({ error: "Product does not belong to vendor" }, { status: 403 });
    }

    const current = Number(product.stock_quantity ?? product.stock ?? 0);
    let next = current;
    if (mode === "count") next = Math.max(0, delta);
    else if (mode === "pick") next = Math.max(0, current - Math.abs(delta));
    else next = Math.max(0, current + delta); // receive

    const updatePayload: Record<string, number> = { stock_quantity: next, stock: next };
    const { error: updErr } = await supabase.from("products").update(updatePayload).eq("id", product_id);

    if (updErr) {
      // fallback stock only
      const { error: e2 } = await supabase.from("products").update({ stock: next }).eq("id", product_id);
      if (e2) return NextResponse.json({ error: e2.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, previous: current, stock: next, mode: mode ?? "receive" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Inventory update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
