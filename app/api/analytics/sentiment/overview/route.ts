import { NextResponse } from "next/server";
import { getSentimentOverview } from "@/lib/ai/sentimentAnalysis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 200);

  try {
    const overview = await getSentimentOverview(limit);
    return NextResponse.json(overview, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load sentiment overview" },
      { status: 500 }
    );
  }
}
