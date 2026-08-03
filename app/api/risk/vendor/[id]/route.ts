import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  calculateRiskScore,
  getRiskLevel,
} from "@/lib/risk/scoring";

export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;

  const score = calculateRiskScore({
    failedPayouts: 2,
    refundRate: 1.4,
    disputeRate: 0.5,
    transactionVelocity: 120,
  });

  return NextResponse.json({
    score,
    level: getRiskLevel(score),
  });
}
