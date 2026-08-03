import { NextResponse } from "next/server";

import { runAMLChecks } from "@/lib/compliance/amlEngine";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: Request) {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
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