// /app/api/kyc/submit/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { userId, documentUrl } = await req.json();

    await supabase.from("kyc_verifications").insert({
      user_id: userId,
      document_url: documentUrl,
      status: "pending",
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}