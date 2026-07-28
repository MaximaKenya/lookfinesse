import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    // 🔍 Get escrow entry
    const { data: escrow } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("order_id", orderId)
      .eq("category", "escrow")
      .single();

    if (!escrow) throw new Error("Escrow not found");

    // 🛑 prevent double release
    if (escrow.status === "completed") {
      return NextResponse.json({ success: true });
    }

    const total = Number(escrow.amount);
    const fee = total * 0.1;
    const vendorAmount = total - fee;

    // ✅ Mark escrow as completed
    await supabase
      .from("ledger_entries")
      .update({ status: "completed" })
      .eq("id", escrow.id);

    // 💰 Vendor credit
    await supabase.from("ledger_entries").insert({
      order_id: orderId,
      vendor_id: escrow.vendor_id,
      amount: vendorAmount,
      type: "credit",
      category: "sale",
      status: "completed",
    });

    // 💸 Platform fee
    await supabase.from("ledger_entries").insert({
      order_id: orderId,
      amount: fee,
      type: "credit",
      category: "fee",
      status: "completed",
    });

    // 💰 Update wallet
    await supabase.rpc("increment_wallet_balance", {
      vendor: escrow.vendor_id,
      amount: vendorAmount,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Release failed" }, { status: 500 });
  }
}