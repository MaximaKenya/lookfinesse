import { NextResponse } from "next/server";

import { generateCopilotInsights } from "@/lib/ai/copilot";

export async function GET() {
  const insights = generateCopilotInsights({
    fraudCount: 0,
    payoutFailures: 0,
    treasuryRisk: 0,
  });

  return NextResponse.json(insights);
}