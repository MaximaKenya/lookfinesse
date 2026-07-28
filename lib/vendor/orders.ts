import type { SupabaseClient } from "@supabase/supabase-js";

export type VendorOrderRow = {
  id: string;
  user_id?: string | null;
  total?: number | null;
  total_amount?: number | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  product_id?: string | null;
};

function orderAmount(order: VendorOrderRow) {
  return Number(order.total ?? order.total_amount ?? 0);
}

/**
 * Resolve vendor-scoped orders via order_items → products (orders has no vendor_id).
 */
export async function fetchVendorOrders(
  supabase: SupabaseClient,
  scope: { vendorId: string; storeId: string | null }
): Promise<VendorOrderRow[]> {
  let productsQuery = supabase.from("products").select("id");

  if (scope.storeId) {
    productsQuery = productsQuery.or(
      `vendor_id.eq.${scope.vendorId},store_id.eq.${scope.storeId}`
    );
  } else {
    productsQuery = productsQuery.eq("vendor_id", scope.vendorId);
  }

  const { data: products, error: productsError } = await productsQuery;
  if (productsError) {
    console.warn("fetchVendorOrders products:", productsError.message);
    return [];
  }

  const productIds = (products ?? []).map((p) => p.id).filter(Boolean);
  if (productIds.length === 0) return [];

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(
      "product_id, order_id, orders ( id, user_id, total, status, created_at, updated_at )"
    )
    .in("product_id", productIds);

  if (itemsError) {
    console.warn("fetchVendorOrders order_items:", itemsError.message);
    return [];
  }

  const byOrder = new Map<string, VendorOrderRow>();

  for (const row of items ?? []) {
    const order = (row as { orders?: VendorOrderRow | null }).orders;
    if (!order?.id) continue;
    const existing = byOrder.get(order.id);
    if (!existing) {
      byOrder.set(order.id, {
        ...order,
        product_id: row.product_id as string,
      });
    }
  }

  return Array.from(byOrder.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function sumOrderRevenue(orders: VendorOrderRow[], statuses: string[]) {
  const set = new Set(statuses);
  return orders
    .filter((o) => set.has(o.status))
    .reduce((sum, o) => sum + orderAmount(o), 0);
}

export { orderAmount };
