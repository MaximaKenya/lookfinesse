import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

import { generateAIInsight } from "@/lib/intelligence/aiInsights";

export async function GET() {
  const { data } = await supabase
    .from("ledger_entries")
    .select("*")
    .limit(200);

  const insight = await generateAIInsight(data);

  return NextResponse.json({
    insight,
  });
}