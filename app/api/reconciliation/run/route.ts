import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  const { data: pending } = await supabase
    .from("payouts")
    .select("*")
    .in("status", ["processing", "queued"]);

  for (const p of pending || []) {
    // check if stuck too long
    const created = new Date(p.created_at).getTime();
    const now = Date.now();

    if (now - created > 1000 * 60 * 10) {
      await supabase
        .from("payouts")
        .update({ status: "failed" })
        .eq("id", p.id);

      // refund escrow
      await supabase.rpc("refund_escrow_balance", {
        v_vendor_id: p.vendor_id,
        v_amount: p.amount,
      });
    }
  }

  return NextResponse.json({ checked: true });
}