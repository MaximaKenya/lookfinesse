import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { reconcileVendor } from "@/lib/core/reconciliationEngine";

export async function GET() {
  const { data: vendors } = await supabase
    .from("profiles")
    .select("id");

  for (const v of vendors || []) {
    await reconcileVendor(v.id);
  }

  return NextResponse.json({ success: true });
}