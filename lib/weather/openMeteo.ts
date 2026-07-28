export const WEATHER_SOURCE = "Open-Meteo" as const;
export const WEATHER_ATTRIBUTION = "Weather data by Open-Meteo (https://open-meteo.com)";

export interface WeatherSummary {
  city: string;
  latitude: number;
  longitude: number;
  temperatureC: number;
  temperatureUnit: "°C";
  feelsLikeC: number;
  weatherCode: number;
  description: string;
  humidity: number;
  windKph: number;
  isDay: boolean;
  high: number | null;
  low: number | null;
  source: typeof WEATHER_SOURCE;
  attribution: string;
  fetchedAt: string;
}

const CODE_TO_DESC: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Heavy rain showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm + hail",
  99: "Thunderstorm + heavy hail",
};

function describe(code: number): string {
  return CODE_TO_DESC[code] ?? "Mixed weather";
}

type CacheEntry = { at: number; data: WeatherSummary };

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 55; // ~1 hour bucket

function hourBucket(): string {
  return new Date().toISOString().slice(0, 13);
}

function cacheKey(city: string, lat: number, lng: number): string {
  return `${city.toLowerCase().trim()}|${lat.toFixed(4)}|${lng.toFixed(4)}|${hourBucket()}`;
}

export async function geocodeCity(
  city: string
): Promise<{ lat: number; lng: number; name: string } | null> {
  const name = city.trim();
  if (!name) return null;

  const queries = name.includes(",") ? [name] : [name, `${name}, Kenya`];

  for (const query of queries) {
    const url =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}` +
      `&count=1&language=en&format=json`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, next: { revalidate: 86400 } });
      if (!res.ok) continue;
      const j = (await res.json()) as {
        results?: { latitude: number; longitude: number; name: string; country?: string }[];
      };
      const hit = j.results?.[0];
      if (!hit) continue;
      const label = hit.country ? `${hit.name}, ${hit.country}` : hit.name;
      return { lat: hit.latitude, lng: hit.longitude, name: label };
    } catch {
      /* try next query */
    } finally {
      clearTimeout(t);
    }
  }

  return null;
}

export async function fetchOpenMeteoWeather(opts: {
  lat: number;
  lng: number;
  city: string;
}): Promise<WeatherSummary | null> {
  const key = cacheKey(opts.city, opts.lat, opts.lng);
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${opts.lat}&longitude=${opts.lng}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, next: { revalidate: 1800 } });
    if (!res.ok) return null;

    const j = (await res.json()) as {
      current?: {
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        weather_code: number;
        wind_speed_10m: number;
        is_day: 0 | 1;
      };
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    };

    const c = j.current;
    if (!c || typeof c.temperature_2m !== "number") return null;
    const d = j.daily;

    const summary: WeatherSummary = {
      city: opts.city,
      latitude: opts.lat,
      longitude: opts.lng,
      temperatureC: Math.round(c.temperature_2m),
      temperatureUnit: "°C",
      feelsLikeC: Math.round(c.apparent_temperature),
      weatherCode: c.weather_code,
      description: describe(c.weather_code),
      humidity: c.relative_humidity_2m,
      windKph: Math.round(c.wind_speed_10m),
      isDay: c.is_day === 1,
      high: d?.temperature_2m_max?.[0] != null ? Math.round(d.temperature_2m_max[0]) : null,
      low: d?.temperature_2m_min?.[0] != null ? Math.round(d.temperature_2m_min[0]) : null,
      source: WEATHER_SOURCE,
      attribution: WEATHER_ATTRIBUTION,
      fetchedAt: new Date().toISOString(),
    };

    CACHE.set(key, { at: Date.now(), data: summary });
    return summary;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
