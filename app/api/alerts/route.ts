import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", {
      ascending: false,
    })
    .limit(20);

  return NextResponse.json(data);
}