import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendor_id");

  if (!vendorId) {
    return NextResponse.json(
      { error: "vendor_id required" },
      { status: 400 }
    );
  }

  const { data: risk } = await supabase
    .from("vendor_risk_scores")
    .select("*")
    .eq("vendor_id", vendorId)
    .single();

  const { data: fraud } = await supabase
    .from("fraud_events")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  const { data: payouts } = await supabase
    .from("payout_queue")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    risk,
    fraud,
    payouts,
  });
}