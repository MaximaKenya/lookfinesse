import { NextResponse } from "next/server";
import { runPayoutWorker } from "@/lib/payouts/payoutWorker";

export async function GET() {
  try {
    await runPayoutWorker();

    return NextResponse.json({
      success: true,
      message: "Payout worker executed",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}