import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { reconcileVendor } from "@/lib/core/reconciliationEngine";
import { cronUnauthorized, isCronAuthorized } from "@/lib/cron/authorize";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return cronUnauthorized();

  const { data: vendors } = await supabase
    .from("profiles")
    .select("id");

  for (const v of vendors || []) {
    await reconcileVendor(v.id);
  }

  return NextResponse.json({ success: true });
}