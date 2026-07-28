// app/api/payments/confirm/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { createLedgerEntry } from "@/lib/finance/ledger";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { orderId } = body;

    // 1. Get order
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      throw new Error("Order not found");
    }

    // 2. Update order status
    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    // 3. Create ledger (idempotent)
    await createLedgerEntry(order);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Payment confirm error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}