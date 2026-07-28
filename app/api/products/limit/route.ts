import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { checkVendorProductLimit } from "@/lib/subscriptions/productLimits";

export async function GET(req: Request) {
  const vendorId = new URL(req.url).searchParams.get("vendor_id");
  if (!vendorId) {
    return NextResponse.json({ error: "vendor_id required" }, { status: 400 });
  }

  const check = await checkVendorProductLimit(supabase, vendorId);
  return NextResponse.json(check);
}
