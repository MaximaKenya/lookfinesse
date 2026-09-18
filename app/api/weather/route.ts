import { NextResponse } from "next/server";
import { resolveLocationWeather } from "@/lib/weather/resolveLocationWeather";
import { WEATHER_ATTRIBUTION, WEATHER_SOURCE } from "@/lib/weather/openMeteo";
import { parseCoord } from "@/lib/geo/haversine";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityParam = searchParams.get("city")?.trim() || null;
  const lat = parseCoord(searchParams.get("lat"));
  const lng = parseCoord(searchParams.get("lng"));
  const geocodeFlag = searchParams.get("geocode") === "1" || searchParams.get("geocode") === "true";
  const geocodeOnly = geocodeFlag && lat == null && lng == null;

  const summary = await resolveLocationWeather({
    city: cityParam,
    lat,
    lng,
    geocodeOnly,
  });

  if (!summary) {
    return NextResponse.json(
      { error: "Weather unavailable", source: WEATHER_SOURCE, attribution: WEATHER_ATTRIBUTION },
      { status: 503 }
    );
  }

  return NextResponse.json(summary, {
    headers: { "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600" },
  });
}
