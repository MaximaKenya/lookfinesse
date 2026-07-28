import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data } = await supabase
    .from("payout_queue")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json({ payouts: data });
}