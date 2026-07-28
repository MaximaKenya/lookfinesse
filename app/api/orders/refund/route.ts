import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    // 🔍 Get original entries
    const { data: entries } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("order_id", orderId);

    if (!entries) throw new Error("No entries found");

    for (const e of entries) {
      await supabase.from("ledger_entries").insert({
        order_id: orderId,
        vendor_id: e.vendor_id,
        amount: e.amount,
        type: e.type === "credit" ? "debit" : "credit",
        category: "refund",
        status: "completed",
      });
    }

    // 💰 Reverse wallet
    const vendorEntry = entries.find((e) => e.vendor_id);

    if (vendorEntry) {
      await supabase.rpc("increment_wallet_balance", {
        vendor: vendorEntry.vendor_id,
        amount: -vendorEntry.amount,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}