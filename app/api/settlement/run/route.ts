import { NextResponse } from "next/server";

import { createSettlementBatch } from "@/lib/settlement/batching";

export async function GET() {
  const result =
    await createSettlementBatch();

  return NextResponse.json({
    success: true,
    result,
  });
}