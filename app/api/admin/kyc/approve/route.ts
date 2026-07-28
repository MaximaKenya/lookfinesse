// /app/api/admin/kyc/approve/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const { kycId, adminId } = await req.json();

  const { data: admin } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", adminId)
    .single();

  if (admin?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await supabase
    .from("kyc_verifications")
    .update({ status: "approved" })
    .eq("id", kycId);

  return NextResponse.json({ success: true });
}