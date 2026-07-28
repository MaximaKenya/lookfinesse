import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { payoutProviderFactory } from "@/lib/payouts/provider";

export async function POST(req: Request) {
  const { vendor_id, amount, provider, stripe_account_id, phone } =
    await req.json();

  const result = await payoutProviderFactory(provider, {
    vendor_id,
    amount,
    stripe_account_id,
    phone,
  });

  await supabase.from("payouts").insert({
    vendor_id,
    amount,
    status: result.status.includes("sent") ? "processing" : "failed",
    method: provider,
    phone,
  });

  return NextResponse.json(result);
}