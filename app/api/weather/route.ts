import { NextResponse } from "next/server";
import {
  fetchOpenMeteoWeather,
  geocodeCity,
  WEATHER_ATTRIBUTION,
  WEATHER_SOURCE,
} from "@/lib/weather/openMeteo";

export const runtime = "nodejs";

const NAIROBI = { lat: -1.2921, lng: 36.8219, city: "Nairobi" };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityParam = searchParams.get("city")?.trim() || NAIROBI.city;
  let lat = parseFloat(searchParams.get("lat") ?? "");
  let lng = parseFloat(searchParams.get("lng") ?? "");
  let city = cityParam;

  const geocodeOnly = searchParams.get("geocode") === "1";
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  if (!hasCoords || geocodeOnly) {
    const geo = await geocodeCity(cityParam);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      city = geo.name;
    } else if (!hasCoords) {
      lat = NAIROBI.lat;
      lng = NAIROBI.lng;
      city = cityParam || NAIROBI.city;
    }
  }

  const summary = await fetchOpenMeteoWeather({ lat, lng, city });

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
