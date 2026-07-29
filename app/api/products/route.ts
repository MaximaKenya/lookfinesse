import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { checkVendorProductLimit, productLimitMessage } from "@/lib/subscriptions/productLimits";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { isPlatformAdmin } from "@/lib/auth/platformAdmin";

async function resolveIsAdmin(): Promise<boolean> {
  try {
    const server = await createSupabaseServer();
    const {
      data: { user },
    } = await server.auth.getUser();
    if (!user) return false;
    const { data: roleRows } = await server
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    return isPlatformAdmin({
      email: user.email,
      roles: (roleRows ?? []).map((r) => r.role),
      appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
    });
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vendor_id,
      store_id,
      name,
      short_description,
      description,
      category,
      category_id,
      price,
      inventory,
      stock,
      sku,
      shipping_fee,
      images,
      image_url,
    } = body;

    if (!vendor_id && !store_id) {
      return NextResponse.json({ error: "vendor_id or store_id required" }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    if (vendor_id) {
      const isAdmin = await resolveIsAdmin();
      const limit = await checkVendorProductLimit(supabase, vendor_id, { isAdmin });
      if (!limit.allowed) {
        return NextResponse.json(
          {
            error: productLimitMessage(limit),
            code: "PRODUCT_LIMIT",
            current: limit.current,
            max: limit.max,
            tier: limit.tier,
          },
          { status: 403 }
        );
      }
    }

    const gallery: string[] = Array.isArray(images)
      ? images.map((img: string | { url: string }) => (typeof img === "string" ? img : img.url))
      : image_url
        ? [image_url]
        : [];

    const insert: Record<string, unknown> = {
      name: name.trim(),
      price: Number(price ?? 0),
      description: description ?? short_description ?? "",
      short_description: short_description ?? description ?? "",
      category: category ?? null,
      category_id: category_id ?? null,
      image_url: gallery[0] ?? null,
      image_gallery: gallery,
      images: gallery,
      inventory: Number(inventory ?? stock ?? 0),
      stock: Number(stock ?? inventory ?? 0),
      stock_quantity: Number(stock ?? inventory ?? 0),
      sku: sku ?? null,
      shipping_fee: Number(shipping_fee ?? 0),
      status: "active",
      is_active: true,
      is_public: true,
    };

    if (vendor_id) insert.vendor_id = vendor_id;
    if (store_id) insert.store_id = store_id;

    const { data: product, error } = await supabase
      .from("products")
      .insert(insert)
      .select("id, name, price, image_url, vendor_id, store_id")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
