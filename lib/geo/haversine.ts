/** Earth radius in kilometres. */
const EARTH_KM = 6371;

export const NAIROBI = {
  lat: -1.2921,
  lng: 36.8219,
  city: "Nairobi",
  label: "Nairobi, Kenya",
} as const;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function hasCoords(lat: unknown, lng: unknown): boolean {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}

export function parseCoord(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatDistanceKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 0.1) return "< 0.1 km";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Rough Nairobi same-day window from distance. */
export function etaMinutesFromKm(km: number): number {
  if (km <= 3) return 35;
  if (km <= 8) return 55;
  if (km <= 15) return 80;
  return 120;
}

export function formatEta(km: number): string {
  const mins = etaMinutesFromKm(km);
  if (mins < 60) return `${mins}–${mins + 15} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const DEFAULT_RADIUS_KM = 15;
export const RADIUS_OPTIONS_KM = [5, 10, 15, 25, 40] as const;

export type NearbyKind = "all" | "shops" | "products" | "services" | "deliveries";

export function normalizeVendorCategory(raw?: string | null): string {
  const c = (raw ?? "").toLowerCase().trim();
  if (["gym", "fitness", "trainer", "training", "workout"].some((k) => c.includes(k))) {
    return "fitness";
  }
  if (["salon", "beauty", "hair", "spa", "facial", "grooming"].some((k) => c.includes(k))) {
    return "beauty";
  }
  if (["fashion", "style", "stylist", "apparel", "clothing"].some((k) => c.includes(k))) {
    return "fashion";
  }
  if (["wellness", "yoga", "massage", "mind"].some((k) => c.includes(k))) {
    return "wellness";
  }
  return c || "wellness";
}

export const CATEGORY_EMOJI: Record<string, string> = {
  fitness: "🏋️",
  beauty: "💅",
  fashion: "👗",
  wellness: "🌿",
  gym: "🏋️",
  salon: "💇",
  stylist: "✨",
};
