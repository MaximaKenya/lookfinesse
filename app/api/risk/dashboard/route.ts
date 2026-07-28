import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data: vendors } = await supabase
    .from("vendor_risk_scores")
    .select("*")
    .order("risk_score", { ascending: false });

  const { data: fraud } = await supabase
    .from("fraud_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: payouts } = await supabase
    .from("payout_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    vendors,
    fraud_events: fraud,
    payouts,
  });
}