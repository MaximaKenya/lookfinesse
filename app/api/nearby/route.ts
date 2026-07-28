import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const NAIROBI = { lat: -1.2921, lng: 36.8219, label: "Nairobi (fallback)" };

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEMO_NEARBY = [
  {
    id: "a1000000-0000-0000-0000-000000000001",
    name: "EliteFit Gym",
    type: "fitness",
    city: "Westlands, Nairobi",
    rating: 4.8,
    lat: -1.2674,
    lng: 36.8075,
  },
  {
    id: "a1000000-0000-0000-0000-000000000002",
    name: "Glow Salon & Spa",
    type: "beauty",
    city: "Kilimani, Nairobi",
    rating: 4.9,
    lat: -1.2921,
    lng: 36.7856,
  },
  {
    id: "a1000000-0000-0000-0000-000000000003",
    name: "Style Bank",
    type: "fashion",
    city: "Lavington, Nairobi",
    rating: 4.7,
    lat: -1.2789,
    lng: 36.7689,
  },
  {
    id: "a1000000-0000-0000-0000-000000000004",
    name: "Zen Wellness",
    type: "wellness",
    city: "Karen, Nairobi",
    rating: 4.6,
    lat: -1.3197,
    lng: 36.7073,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const city = searchParams.get("city");

  const userLat = latParam ? Number(latParam) : null;
  const userLng = lngParam ? Number(lngParam) : null;
  const usingFallback = userLat == null || userLng == null || Number.isNaN(userLat) || Number.isNaN(userLng);

  const originLat = usingFallback ? NAIROBI.lat : userLat;
  const originLng = usingFallback ? NAIROBI.lng : userLng;

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name, category, city, latitude, longitude, rating")
    .limit(50);

  let results = (vendors ?? []).map((v) => {
    const vLat = v.latitude ?? null;
    const vLng = v.longitude ?? null;
    let distanceKm: number | null = null;
    if (vLat != null && vLng != null) {
      distanceKm = haversineKm(originLat, originLng, vLat, vLng);
    }
    return {
      id: v.id,
      name: v.name,
      type: v.category ?? "wellness",
      location: v.city ?? "Nairobi",
      rating: v.rating ?? 4.5,
      distanceKm,
      distance: distanceKm != null ? `${distanceKm.toFixed(1)} km` : null,
      lat: vLat,
      lng: vLng,
    };
  });

  if (!results.length) {
    results = DEMO_NEARBY.map((d) => {
      const distanceKm = haversineKm(originLat, originLng, d.lat, d.lng);
      return {
        id: d.id,
        name: d.name,
        type: d.type,
        location: d.city,
        rating: d.rating,
        distanceKm,
        distance: `${distanceKm.toFixed(1)} km`,
        lat: d.lat,
        lng: d.lng,
      };
    });
  }

  if (city && !usingFallback) {
    const cityLower = city.toLowerCase();
    const cityMatches = results.filter((r) =>
      r.location?.toLowerCase().includes(cityLower)
    );
    if (cityMatches.length) results = cityMatches;
  }

  results.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  return NextResponse.json({
    places: results.slice(0, 20),
    origin: {
      lat: originLat,
      lng: originLng,
      usingFallback,
      fallbackLabel: usingFallback ? NAIROBI.label : null,
    },
  });
}
