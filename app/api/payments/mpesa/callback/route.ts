import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const callbackId =
      body?.Body?.stkCallback?.CheckoutRequestID;

    const existing = await supabase
      .from("mpesa_callbacks")
      .select("id")
      .eq("callback_id", callbackId)
      .maybeSingle();

    if (existing.data) {
      return NextResponse.json({
        success: true,
        duplicate: true,
      });
    }

    await supabase
      .from("mpesa_callbacks")
      .insert({
        callback_id: callbackId,
        payload: body,
      });

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
