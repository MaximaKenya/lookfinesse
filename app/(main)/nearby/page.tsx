"use client";



import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { MapPin, Navigation, Star, LocateFixed, AlertCircle } from "lucide-react";

import NearbyTypeFilter from "@/components/nearby/NearbyTypeFilter";



type Place = {

  id: string;

  name: string;

  type: string;

  location: string;

  distance?: string | null;

  rating?: number;

  emoji?: string;

};



const NAIROBI_FALLBACK = { lat: -1.2921, lng: 36.8219 };



export default function NearbyPage() {

  const [places, setPlaces] = useState<Place[]>([]);

  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);

  const [geoStatus, setGeoStatus] = useState<"idle" | "prompt" | "granted" | "denied" | "fallback">("idle");

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [fallbackLabel, setFallbackLabel] = useState<string | null>(null);



  const fetchNearby = useCallback(async (lat: number, lng: number) => {

    setLoading(true);

    try {

      const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}`);

      const data = await res.json();

      setPlaces(data.places ?? []);

      if (data.origin?.usingFallback) {

        setGeoStatus("fallback");

        setFallbackLabel(data.origin.fallbackLabel ?? "Nairobi (fallback)");

      }

    } catch {

      setPlaces([]);

    } finally {

      setLoading(false);

    }

  }, []);



  const requestLocation = useCallback(() => {

    if (!navigator.geolocation) {

      setGeoStatus("fallback");

      setFallbackLabel("Nairobi (fallback — geolocation unavailable)");

      void fetchNearby(NAIROBI_FALLBACK.lat, NAIROBI_FALLBACK.lng);

      return;

    }



    setGeoStatus("prompt");

    navigator.geolocation.getCurrentPosition(

      (pos) => {

        const lat = pos.coords.latitude;

        const lng = pos.coords.longitude;

        setCoords({ lat, lng });

        setGeoStatus("granted");

        setFallbackLabel(null);

        void fetchNearby(lat, lng);

      },

      () => {

        setGeoStatus("denied");

        setFallbackLabel("Nairobi (fallback — location denied)");

        void fetchNearby(NAIROBI_FALLBACK.lat, NAIROBI_FALLBACK.lng);

      },

      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }

    );

  }, [fetchNearby]);



  useEffect(() => {

    requestLocation();

  }, [requestLocation]);



  const filtered = filter === "all" ? places : places.filter((v) => v.type === filter);



  return (

    <section className="max-w-3xl mx-auto px-4 py-8 space-y-8 pb-24">

      <header className="relative overflow-hidden rounded-3xl border border-cyan-500/15 bg-gradient-to-br from-cyan-950/30 via-black/80 to-blue-950/25 backdrop-blur-xl p-8">

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.1),transparent_60%)]" />

        <div className="relative flex items-center gap-3 mb-2">

          <Navigation className="w-6 h-6 text-cyan-400" />

          <h1 className="text-3xl font-bold text-white">Nearby</h1>

        </div>

        <p className="relative text-white/50">Salons, gyms, trainers & stylists near you</p>

      </header>



      {(geoStatus === "idle" || geoStatus === "prompt") && (

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-md p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">

          <LocateFixed className="w-8 h-8 text-cyan-400 shrink-0" />

          <div className="flex-1">

            <p className="font-semibold text-white text-sm">Enable location for accurate distances</p>

            <p className="text-white/50 text-xs mt-1">We only use your position to sort nearby vendors — never stored without consent.</p>

          </div>

          <button

            type="button"

            onClick={requestLocation}

            className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-sm font-bold hover:bg-cyan-400 shrink-0"

          >

            Use my location

          </button>

        </div>

      )}



      {geoStatus === "denied" && fallbackLabel && (

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3 text-sm">

          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />

          <p className="text-white/70">

            Showing results near <strong className="text-white">{fallbackLabel}</strong>. Enable location in browser settings for precise distances.

          </p>

        </div>

      )}



      {geoStatus === "granted" && coords && (

        <p className="text-xs text-cyan-400/80 flex items-center gap-1.5">

          <LocateFixed className="w-3.5 h-3.5" /> Using your current location

        </p>

      )}



      <NearbyTypeFilter filter={filter} onChange={setFilter} />



      {loading ? (

        <div className="space-y-3 animate-pulse">

          {[1, 2, 3].map((i) => (

            <div key={i} className="h-20 bg-white/5 rounded-2xl" />

          ))}

        </div>

      ) : (

        <div className="space-y-3">

          {filtered.map((v) => (

            <Link key={v.id} href={`/creator/${v.id}`}>

              <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-md p-4 hover:border-cyan-500/25 transition-all group">

                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl shrink-0">

                  {v.emoji || "📍"}

                </div>

                <div className="flex-1 min-w-0">

                  <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors">{v.name}</h3>

                  <p className="text-white/40 text-sm capitalize mt-0.5">{v.type}</p>

                  <div className="flex items-center gap-3 mt-1.5">

                    <span className="flex items-center gap-1 text-xs text-white/35">

                      <MapPin className="w-3 h-3" /> {v.location}

                    </span>

                    {v.rating != null && (

                      <span className="flex items-center gap-1 text-xs text-yellow-400/70">

                        <Star className="w-3 h-3 fill-current" /> {v.rating}

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

          {!filtered.length && (

            <p className="text-center text-white/40 py-8">No places found for this filter.</p>

          )}

        </div>

      )}



      <Link href="/services" className="block text-center bg-white text-black py-3.5 rounded-2xl font-bold hover:bg-white/90 transition-all">

        Browse All Services

      </Link>

    </section>

  );

}

