import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { guardSupabaseEnv, isNetworkError } from "@/lib/api/supabaseRoute";
import type { UserPreferences } from "@/lib/auth/onboarding";
import { isProfileOnboarded } from "@/lib/auth/onboarding";
import {
  formatPrefsSummary,
  hasMeaningfulPrefs,
  prefsForPrompt,
} from "@/lib/ai/profileLabels";
import { getPersonalizedToday } from "@/lib/ai/todayPersonalization";
import type { WeatherInput } from "@/lib/ai/weatherTips";
import { WEATHER_ATTRIBUTION, WEATHER_SOURCE } from "@/lib/weather/openMeteo";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh") === "1" || searchParams.get("refresh") === "true";
  const refreshToken = searchParams.get("bust") ?? (refresh ? String(Date.now()) : undefined);

  let preferences: UserPreferences = {};
  let userId = "anonymous";
  let profileCity: string | null = null;
  let profileLat: number | null = null;
  let profileLng: number | null = null;
  let onboardedAt: string | null = null;

  const envGuard = guardSupabaseEnv();
  if (!envGuard) {
    try {
      const supabase = await createSupabaseServer();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("preferences, city, lat, lng, onboarded_at")
          .eq("user_id", user.id)
          .maybeSingle();

        preferences = (profile?.preferences as UserPreferences) ?? {};
        profileCity = profile?.city ?? preferences.city ?? null;
        profileLat = profile?.lat ?? null;
        profileLng = profile?.lng ?? null;
        onboardedAt = profile?.onboarded_at ?? null;
      }
    } catch (err) {
      if (!isNetworkError(err)) {
        console.warn("[today] profile lookup failed:", err);
      }
    }
  }

  const explicitCity = searchParams.get("city")?.trim() || null;
  const profileResolvedCity = profileCity ?? preferences.city ?? null;
  const city = explicitCity || profileResolvedCity || "Nairobi";
  const useGeocode =
    searchParams.get("geocode") === "1" ||
    searchParams.get("geocode") === "true" ||
    (!!profileResolvedCity && city === profileResolvedCity && profileLat == null);

  const origin = new URL(req.url).origin;
  const weatherQs = new URLSearchParams();
  weatherQs.set("city", city);
  if (useGeocode) {
    weatherQs.set("geocode", "1");
  } else {
    const latParam = searchParams.get("lat") ?? (profileLat != null ? String(profileLat) : "");
    const lngParam = searchParams.get("lng") ?? (profileLng != null ? String(profileLng) : "");
    if (latParam) weatherQs.set("lat", latParam);
    if (lngParam) weatherQs.set("lng", lngParam);
    if (!latParam && !lngParam) weatherQs.set("geocode", "1");
  }

  const wRes = await fetch(`${origin}/api/weather?${weatherQs}`).catch(() => null);
  if (!wRes?.ok) {
    return NextResponse.json(
      {
        error: "Weather unavailable",
        source: WEATHER_SOURCE,
        attribution: WEATHER_ATTRIBUTION,
      },
      { status: 503 }
    );
  }

  const wJson = await wRes.json();
  if (wJson.error) {
    return NextResponse.json(
      {
        error: "Weather unavailable",
        source: WEATHER_SOURCE,
        attribution: WEATHER_ATTRIBUTION,
      },
      { status: 503 }
    );
  }

  const weather: WeatherInput = {
    city: wJson.city,
    temperatureC: wJson.temperatureC,
    description: wJson.description,
    humidity: wJson.humidity,
    windKph: wJson.windKph,
    weatherCode: wJson.weatherCode,
    isDay: wJson.isDay,
  };

  const payload = await getPersonalizedToday(
    weather,
    {
      userId,
      preferences,
      city: profileResolvedCity ?? weather.city,
      profile: { onboarded_at: onboardedAt, preferences },
    },
    { refresh, refreshToken }
  );

  const prefsSummary = formatPrefsSummary(preferences, profileResolvedCity ?? weather.city);
  const needsOnboarding =
    userId !== "anonymous" &&
    !hasMeaningfulPrefs(preferences, { onboarded_at: onboardedAt, preferences });

  return NextResponse.json(
    {
      ...payload,
      profileUsed: prefsForPrompt(preferences, profileResolvedCity ?? weather.city),
      prefsSummary,
      needsOnboarding,
      onboarded: isProfileOnboarded({ onboarded_at: onboardedAt, preferences }),
      weatherMeta: {
        source: wJson.source ?? WEATHER_SOURCE,
        attribution: wJson.attribution ?? WEATHER_ATTRIBUTION,
        temperatureUnit: wJson.temperatureUnit ?? "°C",
        latitude: wJson.latitude,
        longitude: wJson.longitude,
      },
    },
    {
      headers: refresh ? { "Cache-Control": "no-store" } : { "Cache-Control": "private, max-age=300" },
    }
  );
}
