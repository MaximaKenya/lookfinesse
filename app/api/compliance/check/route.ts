import { NextResponse } from "next/server";

import { runAMLChecks } from "@/lib/compliance/amlEngine";

export async function POST(req: Request) {
  const body = await req.json();

  const alerts = await runAMLChecks({
    vendor_id: body.vendor_id,
    transaction_amount:
      body.transaction_amount,
  });

  return NextResponse.json({
    alerts,
  });
}