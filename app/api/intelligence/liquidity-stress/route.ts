import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {

  const { count } = await supabase
    .from("financial_events")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("event_type", "liquidity_low");

  const stress = Math.min(
    (count || 0) * 15,
    100
  );

  return NextResponse.json({
    stress,
  });
}