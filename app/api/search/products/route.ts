import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const query = searchParams.get("q") || "";

  const { data } = await supabase
    .from("products")
    .select("*")
    .ilike("title", `%${query}%`)
    .limit(20);

  return NextResponse.json({
    products: data || [],
  });
}
