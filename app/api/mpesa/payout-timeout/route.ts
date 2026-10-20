import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daraja B2C QueueTimeOutURL (`{BASE_URL}/api/mpesa/payout-timeout`).
 * Acknowledge so Safaricom does not retry-storm. No secrets required.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    console.warn("[mpesa] payout timeout callback", body ? "received" : "empty");
  } catch (err) {
    console.warn("[mpesa] payout timeout callback unreadable", err);
  }
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
