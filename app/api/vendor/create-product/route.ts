import { NextResponse } from "next/server";
import { createFeedPost } from "@/lib/social/createFeedPost";
import { sendFollowerNotifications } from "@/lib/social/sendFollowerNotifications";
import { checkVendorProductLimit, productLimitMessage } from "@/lib/subscriptions/productLimits";
import { requireVendorSession } from "@/lib/vendor/requireVendorSession";

export async function POST(req: Request) {
  try {
    const session = await requireVendorSession();
    if (!session.ok) return session.response;

    const { supabase, scope } = session;
    const body = await req.json();
    const {
      name,
      short_description,
      description,
      category_id,
      price,
      inventory,
      sku,
      shipping_fee,
      images,
      caption,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const limit = await checkVendorProductLimit(supabase, scope.vendorId);
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

    const gallery = Array.isArray(images)
      ? images
          .map((img: string | { url: string }) => (typeof img === "string" ? img : img?.url))
          .filter((url: string) => typeof url === "string" && url.length > 0 && !url.startsWith("blob:"))
      : [];

    const insert: Record<string, unknown> = {
      vendor_id: scope.vendorId,
      name: name.trim(),
      short_description: short_description ?? "",
      description: description ?? short_description ?? "",
      category_id: category_id || null,
      price: Number(price || 0),
      inventory: Number(inventory || 0),
      stock: Number(inventory || 0),
      stock_quantity: Number(inventory || 0),
      sku: sku ?? null,
      shipping_fee: Number(shipping_fee || 0),
      image_url: gallery[0] ?? null,
      image_gallery: gallery,
      images: gallery,
      status: "active",
      is_active: true,
      is_public: true,
    };
    if (scope.storeId) insert.store_id = scope.storeId;

    const { data: product, error } = await supabase
      .from("products")
      .insert(insert)
      .select()
      .single();

    if (error) throw error;

    const feedPost = await createFeedPost(
      {
        vendorId: scope.vendorId,
        productId: product.id,
        caption: caption || short_description || `New drop: ${name}`,
        mediaUrls: gallery,
        thumbnailUrl: gallery[0],
      },
      supabase
    ).catch((err) => {
      console.warn("[create-product] feed post:", err);
      return null;
    });

    await sendFollowerNotifications({
      vendorId: scope.vendorId,
      title: "New Product Drop",
      message: `${name} is now available`,
      imageUrl: gallery[0],
    }).catch(() => null);

    return NextResponse.json({ success: true, product, feedPost });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
