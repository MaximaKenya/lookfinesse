import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { supabase as publicClient } from "@/lib/supabaseClient";
import { queryNearby } from "@/lib/geo/queryNearby";
import { parseCoord } from "@/lib/geo/haversine";
import { guardSupabaseEnv } from "@/lib/api/supabaseRoute";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseCoord(searchParams.get("lat"));
  const lng = parseCoord(searchParams.get("lng"));
  const radiusKm = parseCoord(searchParams.get("radius")) ?? parseCoord(searchParams.get("radiusKm"));
  const kind = searchParams.get("kind") ?? "all";
  const category = searchParams.get("category");

  let client = publicClient;
  const envGuard = guardSupabaseEnv();
  if (!envGuard) {
    try {
      client = await createSupabaseServer();
    } catch {
      client = publicClient;
    }
  }

  const payload = await queryNearby(client, {
    lat,
    lng,
    radiusKm: radiusKm ?? undefined,
    kind,
    category,
  });

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" },
  });
}
