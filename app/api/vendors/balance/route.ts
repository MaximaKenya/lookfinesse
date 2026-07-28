import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");

  const { data } = await supabase
    .from("ledger_entries")
    .select("amount, type")
    .eq("vendor_id", vendorId);

  let balance = 0;

  data?.forEach((entry) => {
    if (entry.type === "credit") balance += Number(entry.amount);
    if (entry.type === "debit") balance -= Number(entry.amount);
  });

  return NextResponse.json({ balance });
}