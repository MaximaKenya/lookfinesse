import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { postJournal } from "@/lib/finance/postJournal";
import { sendMpesaPayout } from "@/lib/mpesa/payout";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: Request) {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  try {
    const { payoutId, adminId } = await req.json();

    const { data: payout } = await supabase
      .from("payouts")
      .select("*")
      .eq("id", payoutId)
      .single();

    if (!payout) throw new Error("Not found");

    const vendorId = payout.vendor_id;

    // 🧾 JOURNAL (Escrow → Cash out)
    await postJournal({
      reference: `payout-${payout.id}`,
      description: "Vendor payout",
      entries: [
        {
          account_id: `escrow:${vendorId}`,
          type: "debit",
          amount: payout.amount,
        },
        {
          account_id: "cash:mpesa",
          type: "credit",
          amount: payout.amount,
        },
      ],
    });

    // 📲 Mpesa
    const { data: vendor } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", vendorId)
      .single();

    if (vendor?.phone) {
      await sendMpesaPayout(vendor.phone, payout.amount);
    }

    await supabase
      .from("payouts")
      .update({ status: "paid" })
      .eq("id", payoutId);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}