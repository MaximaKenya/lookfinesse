import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabaseServer";
import { resolveVendorScope } from "@/lib/vendor/scope";
import { fetchVendorOrders, orderAmount } from "@/lib/vendor/orders";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const scopeResult = await resolveVendorScope(supabase);

    if (!scopeResult.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { vendorId, storeId } = scopeResult.scope;

    let productsQuery = supabase
      .from("products")
      .select(
        "id, vendor_id, store_id, name, price, inventory_count, stock_quantity, status, is_active, image_url, images, created_at"
      )
      .order("created_at", { ascending: false });

    if (storeId) {
      productsQuery = productsQuery.or(
        `vendor_id.eq.${vendorId},store_id.eq.${storeId}`
      );
    } else {
      productsQuery = productsQuery.eq("vendor_id", vendorId);
    }

    const [
      { data: products, error: productsError },
      orders,
      { data: fraudEvents, error: fraudError },
      { data: viewEvents, error: viewsError },
    ] = await Promise.all([
      productsQuery,
      fetchVendorOrders(supabase, { vendorId, storeId }),
      supabase
        .from("fraud_events")
        .select("id, product_id, severity, created_at")
        .eq("vendor_id", vendorId),
      supabase
        .from("user_behavior_events")
        .select("entity_id")
        .eq("entity_type", "product")
        .eq("event_type", "view"),
    ]);

    if (productsError) {
      return NextResponse.json(
        { error: "Failed to fetch vendor products" },
        { status: 500 }
      );
    }

    if (fraudError) console.warn("fraud_events query:", fraudError.message);
    if (viewsError) console.warn("user_behavior_events query:", viewsError.message);

    const productIds = new Set((products ?? []).map((p) => p.id));
    const viewCounts = new Map<string, number>();

    for (const event of viewEvents ?? []) {
      if (!event.entity_id || !productIds.has(event.entity_id)) continue;
      viewCounts.set(
        event.entity_id,
        (viewCounts.get(event.entity_id) ?? 0) + 1
      );
    }

    const enrichedProducts = (products ?? []).map((product) => {
      const productOrders = (orders ?? []).filter(
        (order) => order.product_id === product.id
      );

      const completedOrders = productOrders.filter(
        (order) => order.status === "completed" || order.status === "paid"
      );

      const sales = completedOrders.length;

      const revenue = completedOrders.reduce(
        (sum, order) => sum + orderAmount(order),
        0
      );

      const views = viewCounts.get(product.id) ?? sales * 3;

      const conversionRate =
        views > 0 ? Number(((sales / views) * 100).toFixed(1)) : 0;

      const productFraudEvents = (fraudEvents ?? []).filter(
        (event) => event.product_id === product.id
      );

      let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

      if (productFraudEvents.length >= 5) {
        riskLevel = "HIGH";
      } else if (productFraudEvents.length >= 2) {
        riskLevel = "MEDIUM";
      }

      let aiInsight = "No sales data yet — add images and publish to get started.";

      if (sales > 20) {
        aiInsight =
          "High sales velocity detected. Consider increasing inventory allocation.";
      } else if (Number(product.inventory_count ?? product.stock_quantity ?? 0) < 5) {
        aiInsight =
          "Inventory depletion risk detected. Restocking recommended.";
      } else if (riskLevel === "HIGH") {
        aiInsight =
          "Elevated fraud interaction patterns detected around this product.";
      } else if (conversionRate > 12) {
        aiInsight =
          "Exceptional customer conversion performance observed.";
      } else if (sales > 0) {
        aiInsight = "Stable marketplace performance detected.";
      }

      let normalizedImages: string[] = [];

      if (Array.isArray(product.images)) {
        normalizedImages = product.images;
      } else if (typeof product.images === "string") {
        normalizedImages = [product.images];
      } else if (product.image_url) {
        normalizedImages = [product.image_url];
      }

      return {
        id: product.id,
        vendor_id: product.vendor_id,
        name: product.name,
        price: Number(product.price || 0),
        inventory_count: Number(
          product.inventory_count ?? product.stock_quantity ?? 0
        ),
        status: product.status || "draft",
        sales,
        revenue,
        image_url: product.image_url,
        images: normalizedImages,
        created_at: product.created_at,
        aiInsight,
        conversionRate,
        views,
        riskLevel,
      };
    });

    return NextResponse.json({
      success: true,
      empty: enrichedProducts.length === 0,
      products: enrichedProducts,
    });
  } catch (error) {
    console.error("Vendor products API error:", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
