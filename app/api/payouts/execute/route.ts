import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  getAccessToken,
  getTimestamp,
  generatePassword,
} from "@/lib/mpesa";
import { logAudit } from "@/lib/audit/log";
import { getRequestOrigin } from "@/lib/url";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: Request) {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  try {
    const origin = getRequestOrigin(req);
    const { vendor_id, amount, phone } = await req.json();

    // 🟢 1. CREATE PAYOUT FIRST (CRITICAL)
    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        vendor_id,
        amount,
        status: "processing",
        phone,
      })
      .select()
      .single();

    if (payoutError || !payout) {
      return NextResponse.json(
        { message: "Failed to create payout", error: payoutError },
        { status: 500 }
      );
    }

    // 🟢 2. MPESA AUTH
    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    // 🟢 3. CALL MPESA B2C
    const res = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InitiatorName: process.env.MPESA_INITIATOR,
          SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
          CommandID: "BusinessPayment",
          Amount: amount,
          PartyA: process.env.MPESA_SHORTCODE,
          PartyB: phone,
          Remarks: "Vendor payout",
          QueueTimeOutURL: `${origin}/api/mpesa/payout-timeout`,
          ResultURL: `${origin}/api/mpesa/payout-result?payoutId=${payout.id}`,
          Occasion: "Vendor payout",
        }),
      }
    );

    const data = await res.json();

    // 🟢 4. OPTIONAL: STORE RESPONSE
    await supabase
      .from("payouts")
      .update({
        provider_response: data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payout.id);

    // 🧾 5. AUDIT LOG (NOW SAFE ✅)
    await logAudit({
      action: "payout_created",
      entity: "payout",
      entity_id: payout.id,
      metadata: {
        vendor_id,
        amount,
        phone,
      },
    });

    return NextResponse.json({
      message: "Payout initiated",
      payoutId: payout.id,
      data,
    });

  } catch (err) {
    console.error("🔥 PAYOUT ERROR:", err);

    return NextResponse.json(
      { message: "Payout error", error: String(err) },
      { status: 500 }
    );
  }
}