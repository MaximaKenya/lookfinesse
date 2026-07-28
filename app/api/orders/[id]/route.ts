import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // 1. Get order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  // 2. Get payment (source of truth)
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", id)
    .single();

  // 3. Derive correct status
  let status = "pending";

  if (payment?.status === "paid") status = "paid";
  if (payment?.status === "failed") status = "failed";

  // 4. Sync order if needed
  if (order.status !== status) {
    await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
  }

  return NextResponse.json({
    ...order,
    status,
    payment_status: payment?.status || "pending",
  });
}