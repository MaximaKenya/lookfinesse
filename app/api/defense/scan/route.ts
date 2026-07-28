import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

import { runAutonomousDefense } from "@/lib/defense/autonomousAgent";

export async function GET() {
  const { data: txns } =
    await supabase
      .from("ledger_entries")
      .select("*")
      .limit(100);

  const actions =
    await runAutonomousDefense(
      txns || []
    );

  return NextResponse.json({
    success: true,

    actions,
  });
}