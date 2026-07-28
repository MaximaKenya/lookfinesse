import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Use /api/payouts/request for vendor payouts" });
}

export async function POST() {
  return NextResponse.json(
    { message: "Use /api/payouts/request for vendor payouts" },
    { status: 410 }
  );
}
