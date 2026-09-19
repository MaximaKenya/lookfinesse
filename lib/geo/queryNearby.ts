import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CATEGORY_EMOJI,
  DEFAULT_RADIUS_KM,
  formatDistanceKm,
  formatEta,
  haversineKm,
  hasCoords,
  NAIROBI,
  NearbyKind,
  normalizeVendorCategory,
} from "@/lib/geo/haversine";

export type NearbyPlace = {
  id: string;
  name: string;
  type: string;
  category: string;
  location: string;
  rating?: number | null;
  distanceKm: number | null;
  distance: string | null;
  lat: number | null;
  lng: number | null;
  emoji: string;
  verified?: boolean;
  href: string;
  eta?: string | null;
  ships?: boolean;
};

export type NearbyProduct = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  distanceKm: number | null;
  distance: string | null;
  href: string;
};

export type NearbyService = {
  id: string;
  title: string;
  price: number;
  category: string | null;
  cover_image: string | null;
  vendor_id: string;
  vendor_name: string | null;
  duration_minutes: number | null;
  distanceKm: number | null;
  distance: string | null;
  href: string;
};

export type NearbyPayload = {
  origin: {
    lat: number;
    lng: number;
    usingFallback: boolean;
    fallbackLabel: string | null;
    radiusKm: number;
  };
  places: NearbyPlace[];
  products: NearbyProduct[];
  services: NearbyService[];
  deliveries: NearbyPlace[];
};

type VendorRow = {
  id: string;
  name: string | null;
  business_name: string | null;
  category: string | null;
  location: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  is_verified: boolean | null;
  delivery_radius_km?: number | null;
};

const DEMO_VENDORS: VendorRow[] = [
  {
    id: "a1000000-0000-0000-0000-000000000001",
    name: "EliteFit Gym",
    business_name: "EliteFit Gym",
    category: "fitness",
    location: "Westlands, Nairobi",
    address: "Westlands",
    lat: -1.2674,
    lng: 36.8075,
    is_verified: true,
    delivery_radius_km: 20,
  },
  {
    id: "a1000000-0000-0000-0000-000000000002",
    name: "Glow Salon & Spa",
    business_name: "Glow Salon & Spa",
    category: "beauty",
    location: "Kilimani, Nairobi",
    address: "Dennis Pritt Rd",
    lat: -1.2916,
    lng: 36.7836,
    is_verified: true,
    delivery_radius_km: 15,
  },
  {
    id: "a1000000-0000-0000-0000-000000000003",
    name: "Style Bank",
    business_name: "Style Bank",
    category: "fashion",
    location: "Lavington, Nairobi",
    address: "Lavington",
    lat: -1.2789,
    lng: 36.7689,
    is_verified: true,
    delivery_radius_km: 25,
  },
  {
    id: "a1000000-0000-0000-0000-000000000004",
    name: "Zen Wellness",
    business_name: "Zen Wellness",
    category: "wellness",
    location: "Karen, Nairobi",
    address: "Karen",
    lat: -1.3197,
    lng: 36.7073,
    is_verified: true,
    delivery_radius_km: 20,
  },
];

function toPlace(
  v: VendorRow,
  originLat: number,
  originLng: number
): NearbyPlace {
  const cat = normalizeVendorCategory(v.category);
  const distanceKm =
    hasCoords(v.lat, v.lng) ? haversineKm(originLat, originLng, Number(v.lat), Number(v.lng)) : null;
  const radius = v.delivery_radius_km ?? 20;
  const ships = distanceKm != null && distanceKm <= radius;
  return {
    id: v.id,
    name: v.business_name || v.name || "Vendor",
    type: cat,
    category: cat,
    location: v.location || v.address || "Nairobi",
    distanceKm,
    distance: formatDistanceKm(distanceKm),
    lat: v.lat,
    lng: v.lng,
    emoji: CATEGORY_EMOJI[cat] ?? "📍",
    verified: !!v.is_verified,
    href: `/creator/${v.id}`,
    eta: distanceKm != null && ships ? formatEta(distanceKm) : null,
    ships,
  };
}

export async function queryNearby(
  supabase: SupabaseClient,
  opts: {
    lat?: number | null;
    lng?: number | null;
    radiusKm?: number;
    kind?: NearbyKind | string;
    category?: string | null;
  }
): Promise<NearbyPayload> {
  const usingFallback = !hasCoords(opts.lat, opts.lng);
  const originLat = usingFallback ? NAIROBI.lat : (opts.lat as number);
  const originLng = usingFallback ? NAIROBI.lng : (opts.lng as number);
  const radiusKm = Number.isFinite(opts.radiusKm) && (opts.radiusKm as number) > 0
    ? Math.min(opts.radiusKm as number, 80)
    : DEFAULT_RADIUS_KM;
  const kind = (opts.kind as NearbyKind) || "all";
  const category = opts.category && opts.category !== "all" ? opts.category : null;

  let vendors: VendorRow[] = [];
  const { data, error } = await supabase
    .from("vendors")
    .select("id, name, business_name, category, location, address, lat, lng, is_verified, delivery_radius_km")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .limit(80);

  if (!error && data?.length) {
    vendors = data as VendorRow[];
  } else {
    const fallback = await supabase
      .from("vendors")
      .select("id, name, business_name, category, location, address, lat, lng, is_verified")
      .limit(80);
    if (!fallback.error && fallback.data?.length) {
      vendors = fallback.data as VendorRow[];
    }
  }

  if (!vendors.length) vendors = DEMO_VENDORS;

  let places = vendors
    .map((v) => toPlace(v, originLat, originLng))
    .filter((p) => p.distanceKm == null || p.distanceKm <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  if (category) {
    places = places.filter((p) => p.category === normalizeVendorCategory(category) || p.type === category);
  }

  const vendorIds = places.map((p) => p.id);
  const vendorById = new Map(places.map((p) => [p.id, p]));

  let products: NearbyProduct[] = [];
  let services: NearbyService[] = [];

  if (vendorIds.length && (kind === "all" || kind === "products" || kind === "shops" || kind === "deliveries")) {
    const { data: productRows } = await supabase
      .from("products")
      .select("id, name, price, image_url, category, vendor_id")
      .in("vendor_id", vendorIds)
      .eq("is_active", true)
      .limit(60);

    products = (productRows ?? []).map((p) => {
      const place = vendorById.get(p.vendor_id as string);
      return {
        id: p.id as string,
        name: p.name as string,
        price: Number(p.price ?? 0),
        image_url: (p.image_url as string) ?? null,
        category: (p.category as string) ?? null,
        vendor_id: (p.vendor_id as string) ?? null,
        vendor_name: place?.name ?? null,
        distanceKm: place?.distanceKm ?? null,
        distance: place?.distance ?? null,
        href: `/product/${p.id}`,
      };
    });
    products.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }

  if (vendorIds.length && (kind === "all" || kind === "services")) {
    const { data: serviceRows } = await supabase
      .from("services")
      .select("id, title, price, category, cover_image, vendor_id, duration_minutes, status")
      .in("vendor_id", vendorIds)
      .eq("status", "active")
      .limit(60);

    services = (serviceRows ?? []).map((s) => {
      const place = vendorById.get(s.vendor_id as string);
      return {
        id: s.id as string,
        title: s.title as string,
        price: Number(s.price ?? 0),
        category: (s.category as string) ?? null,
        cover_image: (s.cover_image as string) ?? null,
        vendor_id: s.vendor_id as string,
        vendor_name: place?.name ?? null,
        duration_minutes: (s.duration_minutes as number) ?? null,
        distanceKm: place?.distanceKm ?? null,
        distance: place?.distance ?? null,
        href: `/services/${s.id}`,
      };
    });
    services.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }

  const deliveries = places.filter((p) => p.ships);

  return {
    origin: {
      lat: originLat,
      lng: originLng,
      usingFallback,
      fallbackLabel: usingFallback ? NAIROBI.label : null,
      radiusKm,
    },
    places,
    products,
    services,
    deliveries,
  };
}
