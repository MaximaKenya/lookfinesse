import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data: accounts } = await supabase
    .from("treasury_accounts")
    .select("*");

  const { data: pools } = await supabase
    .from("liquidity_pools")
    .select("*");

  const { data: forecasts } = await supabase
    .from("payout_forecasts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    accounts,
    pools,
    forecasts,
  });
}