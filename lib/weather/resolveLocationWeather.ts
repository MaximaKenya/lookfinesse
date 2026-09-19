import {
  fetchOpenMeteoWeather,
  geocodeCity,
  type WeatherSummary,
} from "@/lib/weather/openMeteo";
import { hasCoords, NAIROBI } from "@/lib/geo/haversine";

export type WeatherQuery = {
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  /** Only geocode the city when coordinates are missing. */
  geocodeOnly?: boolean;
};

/**
 * Resolve weather without an internal HTTP hop (self-fetch to /api/weather
 * fails on Heroku/serverless when origin is unreachable from itself).
 */
export async function resolveLocationWeather(query: WeatherQuery): Promise<WeatherSummary | null> {
  let city = query.city?.trim() || NAIROBI.city;
  let lat = query.lat ?? NaN;
  let lng = query.lng ?? NaN;
  const coordsOk = hasCoords(lat, lng);
  const shouldGeocode = !coordsOk || (query.geocodeOnly && !coordsOk);

  if (shouldGeocode) {
    const geo = await geocodeCity(city);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      city = geo.name;
    } else if (!coordsOk) {
      lat = NAIROBI.lat;
      lng = NAIROBI.lng;
      city = city || NAIROBI.city;
    }
  }

  if (!hasCoords(lat, lng)) {
    lat = NAIROBI.lat;
    lng = NAIROBI.lng;
  }

  return fetchOpenMeteoWeather({ lat, lng, city });
}
