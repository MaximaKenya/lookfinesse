import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");

  const { data } = await supabase
    .from("payouts")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data });
}