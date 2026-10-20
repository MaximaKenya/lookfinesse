import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cronUnauthorized, isCronAuthorized } from "@/lib/cron/authorize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return cronUnauthorized();

  const { data: schedules } = await supabase
    .from("payout_schedules")
    .select("*")
    .eq("auto_payout", true);

  for (const s of schedules || []) {
    const { data: ledger } = await supabase
      .from("ledger_entries")
      .select("*")
      .eq("vendor_id", s.vendor_id);

    let balance = 0;

    ledger?.forEach((l) => {
      if (l.type === "credit") balance += Number(l.amount);
      if (l.type === "debit") balance -= Number(l.amount);
    });

    if (balance >= s.min_amount) {
      await supabase.from("payouts").insert({
        vendor_id: s.vendor_id,
        amount: balance,
        status: "pending",
        method: "auto",
      });

      await supabase
        .from("payout_schedules")
        .update({ last_run: new Date().toISOString() })
        .eq("id", s.id);
    }
  }

  return NextResponse.json({ message: "Scheduler executed" });
}