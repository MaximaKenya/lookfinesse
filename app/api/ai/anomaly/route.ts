import { NextResponse } from "next/server";
import { detectAnomaly } from "@/lib/ai/anomalyEngine";

export async function POST(req: Request) {
  const body = await req.json();

  const result = detectAnomaly(body);

  return NextResponse.json(result);
}