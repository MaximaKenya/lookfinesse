// /app/api/admin/kyc/approve/route.ts
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  const { kycId } = await req.json();
  if (!kycId) {
    return NextResponse.json({ error: "kycId required" }, { status: 400 });
  }

  const { error } = await db
    .from("kyc_verifications")
    .update({ status: "approved" })
    .eq("id", kycId);

  if (error) {
    // Fallback table name used in some schemas
    const retry = await db
      .from("vendor_kyc")
      .update({ verification_status: "APPROVED" })
      .eq("id", kycId);
    if (retry.error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
