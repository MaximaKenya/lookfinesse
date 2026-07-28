// /app/api/payouts/request/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { vendorId, amount } = await req.json();

    if (!vendorId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // 🔐 1. KYC CHECK
    const { data: kyc } = await supabase
      .from("kyc_verifications")
      .select("*")
      .eq("user_id", vendorId)
      .eq("status", "approved")
      .single();

    if (!kyc) {
      return NextResponse.json(
        { error: "KYC not approved" },
        { status: 403 }
      );
    }

    // 🧠 2. TIER CHECK
    const { data: tier } = await supabase
      .from("vendor_tiers")
      .select("*")
      .eq("id", kyc.tier_id)
      .single();

    if (tier && amount > tier.payout_limit) {
      return NextResponse.json(
        { error: "Exceeds payout limit for your tier" },
        { status: 400 }
      );
    }

    // 📊 3. DAILY LIMIT (velocity control)
    const today = new Date().toISOString().slice(0, 10);

    const { data: todayPayouts } = await supabase
      .from("payouts")
      .select("amount")
      .eq("vendor_id", vendorId)
      .gte("created_at", today);

    const dailyTotal =
      todayPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const DAILY_CAP = 200000;

    if (dailyTotal + amount > DAILY_CAP) {
      return NextResponse.json(
        { error: "Daily payout limit exceeded" },
        { status: 403 }
      );
    }

    // 🔍 4. DYNAMIC FRAUD SCORE
    let fraudScore = 0;

    if (amount > 100000) fraudScore += 0.4;
    if (dailyTotal > 150000) fraudScore += 0.3;
    if (!tier) fraudScore += 0.2;

    if (fraudScore > 0.7) {
      await supabase.from("fraud_logs").insert({
        vendor_id: vendorId,
        reason: "High risk payout",
        risk_score: fraudScore,
      });

      return NextResponse.json(
        { error: "Payout flagged for review" },
        { status: 403 }
      );
    }

    // 🔁 5. IDEMPOTENCY KEY (prevents duplicate payouts)
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${vendorId}-${amount}-${Date.now()}`)
      .digest("hex");

    // 💰 6. ATOMIC ESCROW DEDUCTION (DB-SAFE)
    const { data: result, error: rpcError } = await supabase.rpc(
      "reserve_escrow_balance",
      {
        v_vendor_id: vendorId,
        v_amount: amount,
      }
    );

    if (rpcError || !result) {
      return NextResponse.json(
        { error: "Insufficient escrow balance (atomic check failed)" },
        { status: 400 }
      );
    }

    // 🧾 7. CREATE PAYOUT (QUEUE)
    const { data: payout, error } = await supabase
      .from("payouts")
      .insert({
        vendor_id: vendorId,
        amount,
        status: "queued", // 🔥 IMPORTANT
        method: "mpesa",
        idempotency_key: idempotencyKey,
        retry_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // 🧾 8. LEDGER ENTRY (reserved funds)
    await supabase.from("ledger_entries").insert({
      vendor_id: vendorId,
      amount,
      type: "debit",
      category: "payout_reserved",
      description: "Funds reserved for payout",
      status: "pending",
      idempotency_key: `reserve-${payout.id}`,
    });

    return NextResponse.json({
      success: true,
      payoutId: payout.id,
    });

  } catch (err) {
    console.error("❌ payout request error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}