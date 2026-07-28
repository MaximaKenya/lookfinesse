import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data } = await supabase
    .from("ledger_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    stream: data || []
  });
}