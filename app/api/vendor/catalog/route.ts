import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabaseServer";
import { resolveVendorScope } from "@/lib/vendor/scope";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedVendorId = searchParams.get("vendor_id");
  const requestedStoreId = searchParams.get("store_id");

  const supabase = await createSupabaseServer();
  const scopeResult = await resolveVendorScope(supabase);

  if (!scopeResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vendorId, storeId } = scopeResult.scope;

  if (
    requestedVendorId &&
    requestedVendorId !== vendorId &&
    requestedVendorId !== scopeResult.scope.userId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (requestedStoreId && storeId && requestedStoreId !== storeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let productsQuery = supabase
    .from("products")
    .select(
      "id, name, price, image_url, images, image_gallery, vendor_id, store_id, status, is_active"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (storeId) {
    productsQuery = productsQuery.or(
      `vendor_id.eq.${vendorId},store_id.eq.${storeId}`
    );
  } else {
    productsQuery = productsQuery.eq("vendor_id", vendorId);
  }

  const [productsRes, servicesRes] = await Promise.all([
    productsQuery,
    supabase
      .from("services")
      .select("id, title, price, category, cover_image, vendor_id, status")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const products = (productsRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price ?? 0),
    image_url:
      p.image_url ??
      (Array.isArray(p.image_gallery) ? p.image_gallery[0] : null) ??
      (Array.isArray(p.images) ? p.images[0] : null),
  }));

  const services = (servicesRes.data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    price: Number(s.price ?? 0),
    category: s.category,
    cover_image: s.cover_image,
  }));

  return NextResponse.json({ products, services });
}
