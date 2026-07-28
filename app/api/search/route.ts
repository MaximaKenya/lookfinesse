import { NextResponse } from "next/server";
import { semanticSearch } from "@/lib/ai/semanticSearch";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const results = await semanticSearch(q);
  return NextResponse.json(results);
}
