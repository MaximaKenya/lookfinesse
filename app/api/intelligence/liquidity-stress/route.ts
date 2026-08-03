import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;

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