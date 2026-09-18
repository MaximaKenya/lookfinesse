"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bike,
  Calendar,
  LocateFixed,
  MapPin,
  Navigation,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";
import NearbyTypeFilter from "@/components/nearby/NearbyTypeFilter";
import NearbyMap from "@/components/nearby/NearbyMap";
import { useUserLocation } from "@/hooks/useUserLocation";
import { DEFAULT_RADIUS_KM, RADIUS_OPTIONS_KM, hasCoords } from "@/lib/geo/haversine";

type Tab = "shops" | "services" | "deliveries";

type Place = {
  id: string;
  name: string;
  type: string;
  category?: string;
  location: string;
  distance?: string | null;
  distanceKm?: number | null;
  rating?: number;
  emoji?: string;
  verified?: boolean;
  href?: string;
  lat?: number | null;
  lng?: number | null;
  eta?: string | null;
  ships?: boolean;
};

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  vendor_name: string | null;
  distance: string | null;
  href: string;
};

type Service = {
  id: string;
  title: string;
  price: number;
  cover_image: string | null;
  vendor_name: string | null;
  duration_minutes: number | null;
  distance: string | null;
  href: string;
};

export default function NearbyExplorer({
  initialTab = "shops",
}: {
  initialTab?: Tab;
}) {
  const { status, location, error, request, fallbackLabel } = useUserLocation();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [filter, setFilter] = useState("all");
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [loading, setLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [deliveries, setDeliveries] = useState<Place[]>([]);
  const [origin, setOrigin] = useState({ lat: -1.2921, lng: 36.8219 });

  const fetchNearby = useCallback(
    async (lat: number, lng: number, radius: number) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          radius: String(radius),
          kind: "all",
        });
        if (filter !== "all") qs.set("category", filter);
        const res = await fetch(`/api/nearby?${qs}`);
        const data = await res.json();
        setPlaces(data.places ?? []);
        setProducts(data.products ?? []);
        setServices(data.services ?? []);
        setDeliveries(data.deliveries ?? []);
        if (data.origin?.lat != null) {
          setOrigin({ lat: data.origin.lat, lng: data.origin.lng });
        }
      } catch {
        setPlaces([]);
        setProducts([]);
        setServices([]);
        setDeliveries([]);
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    if (!location) return;
    void fetchNearby(location.lat, location.lng, radiusKm);
  }, [location, radiusKm, fetchNearby]);

  const filteredPlaces = useMemo(() => {
    if (filter === "all") return places;
    return places.filter((v) => v.category === filter || v.type === filter);
  }, [places, filter]);

  const mapPoints = filteredPlaces
    .filter((p) => hasCoords(p.lat, p.lng))
    .map((p) => ({ id: p.id, lat: p.lat as number, lng: p.lng as number, name: p.name }));

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-6 pb-24">
      <header className="relative overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-cyan-950/30 via-black/80 to-blue-950/25 p-8">
        <div className="relative flex items-center gap-3 mb-2">
          <Navigation className="w-6 h-6 text-cyan-400" />
          <h1 className="text-3xl font-bold text-white">Near me</h1>
        </div>
        <p className="relative text-white/50 text-sm">
          Shop, book, and get deliveries from vendors closest to you.
        </p>
      </header>

      {(status === "idle" || status === "prompt") && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <LocateFixed className="w-8 h-8 text-cyan-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-white text-sm">Share location for real distances</p>
            <p className="text-white/50 text-xs mt-1">
              Used only to sort nearby shops, bookings, and delivery windows — never sold.
            </p>
          </div>
          <button
            type="button"
            onClick={request}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-sm font-bold hover:bg-cyan-400 shrink-0"
          >
            Use my location
          </button>
        </div>
      )}

      {(status === "denied" || status === "unavailable" || status === "fallback") && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white/70">
              Showing results near <strong className="text-white">{fallbackLabel}</strong>.
              {error ? ` ${error}` : ""}
            </p>
            <button type="button" onClick={request} className="text-cyan-300 text-xs mt-1 underline">
              Try location again
            </button>
          </div>
        </div>
      )}

      {status === "granted" && location && !location.usingFallback && (
        <p className="text-xs text-cyan-400/80 flex items-center gap-1.5">
          <LocateFixed className="w-3.5 h-3.5" /> Using your current location
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-white/45 uppercase tracking-wider font-semibold">Radius</p>
        <div className="flex flex-wrap gap-1.5">
          {RADIUS_OPTIONS_KM.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setRadiusKm(km)}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                radiusKm === km ? "bg-white text-black" : "bg-white/5 text-white/50 border border-white/8"
              }`}
            >
              {km} km
            </button>
          ))}
        </div>
      </div>

      <NearbyMap origin={origin} points={mapPoints} />

      <NearbyTypeFilter filter={filter} onChange={setFilter} />

      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { id: "shops", label: "Shop", icon: ShoppingBag },
            { id: "services", label: "Book", icon: Calendar },
            { id: "deliveries", label: "Deliver", icon: Bike },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold border transition ${
              tab === id
                ? "bg-white text-black border-white"
                : "bg-white/5 text-white/55 border-white/10 hover:text-white"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl" />
          ))}
        </div>
      ) : tab === "shops" ? (
        <PlaceList
          places={filteredPlaces}
          empty="No shops in this radius. Widen the range or pick another category."
        />
      ) : tab === "services" ? (
        <ServiceList services={services} />
      ) : (
        <DeliveryList places={deliveries} products={products} />
      )}

      {tab === "shops" && products.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/70">Products nearby</h2>
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href={p.href}
                className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-cyan-500/30 transition"
              >
                <div className="aspect-[4/5] bg-[#111] relative">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-2xl">🛍️</div>
                  )}
                </div>
                <div className="p-3 space-y-0.5">
                  <p className="text-xs font-semibold text-white line-clamp-2">{p.name}</p>
                  <p className="text-[11px] text-white/40">{p.vendor_name}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">KES {p.price.toLocaleString()}</span>
                    {p.distance && <span className="text-cyan-400">{p.distance}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/shop?near=1" className="text-center bg-white text-black py-3.5 rounded-2xl font-bold hover:bg-white/90">
          Shop all nearby
        </Link>
        <Link
          href="/services?near=1"
          className="text-center border border-white/15 py-3.5 rounded-2xl font-bold text-white hover:bg-white/5"
        >
          Browse all bookings
        </Link>
      </div>
    </section>
  );
}

function PlaceList({ places, empty }: { places: Place[]; empty: string }) {
  if (!places.length) {
    return <p className="text-center text-white/40 py-8 text-sm">{empty}</p>;
  }
  return (
    <div className="space-y-3">
      {places.map((v) => (
        <Link key={v.id} href={v.href || `/creator/${v.id}`}>
          <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 hover:border-cyan-500/25 transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl shrink-0">
              {v.emoji || "📍"}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white group-hover:text-cyan-300 truncate">{v.name}</h3>
              <p className="text-white/40 text-sm capitalize mt-0.5">{v.category || v.type}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-white/35">
                  <MapPin className="w-3 h-3" /> {v.location}
                </span>
                {v.verified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400/80">
                    <Star className="w-3 h-3 fill-current" /> Verified
                  </span>
                )}
              </div>
            </div>
            {v.distance && (
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full shrink-0">
                {v.distance}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function ServiceList({ services }: { services: Service[] }) {
  if (!services.length) {
    return (
      <p className="text-center text-white/40 py-8 text-sm">
        No bookable services in this radius. Try a wider range or{" "}
        <Link href="/services" className="text-cyan-300 underline">
          browse all
        </Link>
        .
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {services.map((s) => (
        <Link key={s.id} href={s.href}>
          <div className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 hover:border-cyan-500/25">
            <div className="w-16 h-16 rounded-2xl bg-[#111] overflow-hidden shrink-0">
              {s.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.cover_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-xl">📅</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">{s.title}</h3>
              <p className="text-xs text-white/40 mt-0.5">{s.vendor_name}</p>
              <p className="text-xs text-white/50 mt-1">
                KES {s.price.toLocaleString()}
                {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
              </p>
            </div>
            {s.distance && (
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full h-fit">
                {s.distance}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function DeliveryList({ places, products }: { places: Place[]; products: Product[] }) {
  if (!places.length) {
    return (
      <p className="text-center text-white/40 py-8 text-sm">
        No vendors can deliver inside this radius. Widen it, or choose pickup at checkout.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-xs text-white/45">
        Same-area delivery from vendors within their service radius. ETAs are estimates for Nairobi traffic.
      </p>
      {places.map((v) => (
        <Link key={v.id} href={`/creator/${v.id}`}>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 hover:border-cyan-500/25 flex items-center gap-4">
            <Store className="w-8 h-8 text-cyan-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">{v.name}</h3>
              <p className="text-xs text-white/45 mt-0.5">
                {v.distance} · ETA {v.eta ?? "same day"}
              </p>
            </div>
            <Bike className="w-4 h-4 text-white/30" />
          </div>
        </Link>
      ))}
      {products.slice(0, 6).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white/70 mb-3">Can deliver these</h2>
          <div className="space-y-2">
            {products.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                href={p.href}
                className="flex items-center justify-between rounded-xl border border-white/8 px-3 py-2 text-sm"
              >
                <span className="truncate text-white">{p.name}</span>
                <span className="text-cyan-400 text-xs shrink-0 ml-2">{p.distance}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
