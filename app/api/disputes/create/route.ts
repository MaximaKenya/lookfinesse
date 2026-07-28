import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const { paymentId, reason, userId } = await req.json();

  const { data, error } = await supabase
    .from("disputes")
    .insert({
      payment_id: paymentId,
      user_id: userId,
      reason,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true, dispute: data });
}