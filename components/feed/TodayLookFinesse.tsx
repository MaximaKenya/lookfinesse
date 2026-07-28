"use client";



import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { useCurrentUser } from "@/hooks/useCurrentUser";

import {

  Cloud,

  CloudRain,

  CloudSun,

  Sun,

  MapPin,

  Sparkles,

  ShoppingBag,

  Shirt,

  Flower2,

  Dumbbell,

  ArrowRight,

  LocateFixed,

  AlertCircle,

  RefreshCw,

} from "lucide-react";



interface TodayResponse {

  weather: {

    city: string;

    temperatureC: number;

    description: string;

    humidity: number;

    windKph: number;

    weatherCode: number;

    isDay: boolean;

    high?: number | null;

    low?: number | null;

  };

  weatherMeta?: {

    source?: string;

    attribution?: string;

    temperatureUnit?: string;

  };

  summary: string;

  prefsSummary?: string | null;

  needsOnboarding?: boolean;

  tips: {

    category: "outfit" | "skincare" | "fitness";

    title: string;

    body: string;

    productHref: string;

    productLabel: string;

    serviceHref: string;

    serviceLabel: string;

  }[];

  error?: string;

}



const DEFAULT_CITY = "Nairobi";

const DEFAULT_LAT = -1.2921;

const DEFAULT_LNG = 36.8219;



function iconForCode(code: number) {

  if (code === 0 || code === 1) return Sun;

  if (code <= 3) return CloudSun;

  if (code >= 51) return CloudRain;

  return Cloud;

}



const ICONS = { outfit: Shirt, skincare: Flower2, fitness: Dumbbell } as const;

const COLORS = {

  outfit: "from-purple-500/20 to-pink-500/15 border-purple-500/25",

  skincare: "from-pink-500/20 to-rose-500/15 border-pink-500/25",

  fitness: "from-cyan-500/20 to-blue-500/15 border-cyan-500/25",

} as const;



type Geo = { lat: number; lng: number; city: string };



export default function TodayLookFinesse() {

  const { userId } = useCurrentUser();

  const [profileReady, setProfileReady] = useState(false);

  const [profileCity, setProfileCity] = useState<string | null>(null);

  const [prefsSummary, setPrefsSummary] = useState<string | null>(null);

  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [data, setData] = useState<TodayResponse | null>(null);

  const [weatherUnavailable, setWeatherUnavailable] = useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [city, setCity] = useState(DEFAULT_CITY);

  const [manualCity, setManualCity] = useState("");

  const [locationNote, setLocationNote] = useState<string | null>(null);

  const geoRef = useRef<Geo>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, city: DEFAULT_CITY });



  const fetchTips = useCallback(

    async (geo: Geo, opts?: { refresh?: boolean; geocode?: boolean }) => {

      if (opts?.refresh) setRefreshing(true);

      else setLoading(true);



      const qs = new URLSearchParams();

      qs.set("city", geo.city);

      if (opts?.geocode || !geo.lat || !geo.lng) {

        qs.set("geocode", "1");

      } else {

        qs.set("lat", String(geo.lat));

        qs.set("lng", String(geo.lng));

      }

      if (opts?.refresh) {

        qs.set("refresh", "1");

        qs.set("bust", String(Date.now()));

      }



      try {

        const r = await fetch(`/api/today?${qs}`);

        if (!r.ok) {

          setWeatherUnavailable(true);

          setData(null);

          return;

        }

        const d = await r.json();

        if (d?.error || !d?.weather) {

          setWeatherUnavailable(true);

          setData(null);

          return;

        }

        setWeatherUnavailable(false);

        setData(d);

        setPrefsSummary(d.prefsSummary ?? null);

        setNeedsOnboarding(!!d.needsOnboarding);

        if (d.weather?.city) setCity(d.weather.city);

      } catch {

        setWeatherUnavailable(true);

        setData(null);

      } finally {

        setLoading(false);

        setRefreshing(false);

      }

    },

    []

  );



  useEffect(() => {

    if (!userId) {

      setProfileReady(true);

      return;

    }

    fetch("/api/profile")

      .then((r) => r.json())

      .then((p) => {

        const pr = p?.preferences ?? {};

        const c = p?.city ?? pr.city ?? null;

        if (c) {

          setProfileCity(c);

          setCity(c);

        }

        const summaryParts = [

          pr.gender === "female" ? "woman" : pr.gender === "male" ? "man" : pr.gender,

          pr.age_group === "35-44" || pr.age_group === "45-54" || pr.age_group === "55+" ? "35+" : pr.age_group,

          c,

        ].filter(Boolean);

        if (summaryParts.length >= 2) {

          setPrefsSummary(summaryParts.join(" · "));

        }

      })

      .catch(() => {})

      .finally(() => setProfileReady(true));

  }, [userId]);



  useEffect(() => {

    if (!profileReady) return;



    let cancelled = false;

    const initialCity = profileCity ?? DEFAULT_CITY;



    const load = (geo: Geo, note: string | null) => {

      if (cancelled) return;

      geoRef.current = geo;

      setCity(geo.city);

      setLocationNote(note);

      void fetchTips(geo, { geocode: !geo.lat || !geo.lng });

    };



    if (profileCity) {

      load(

        { lat: 0, lng: 0, city: profileCity },

        `Using your profile city (${profileCity}) — geocoded via Open-Meteo.`

      );

      return () => {

        cancelled = true;

      };

    }



    const fallback = () =>

      load(

        { lat: DEFAULT_LAT, lng: DEFAULT_LNG, city: initialCity },

        profileCity

          ? `Using ${profileCity} — geocoded via Open-Meteo.`

          : "Using Nairobi coordinates. Enter your city below or enable GPS."

      );



    if (typeof navigator !== "undefined" && navigator.geolocation) {

      navigator.geolocation.getCurrentPosition(

        (pos) =>

          load(

            { lat: pos.coords.latitude, lng: pos.coords.longitude, city: initialCity },

            null

          ),

        () => {

          if (!cancelled) fallback();

        },

        { timeout: 4000, maximumAge: 1000 * 60 * 30 }

      );

    } else {

      fallback();

    }



    return () => {

      cancelled = true;

    };

  }, [profileReady, profileCity, fetchTips]);



  const applyManualCity = () => {

    const next = manualCity.trim() || profileCity || DEFAULT_CITY;

    const geo = { lat: 0, lng: 0, city: next };

    geoRef.current = geo;

    setCity(next);

    setLocationNote(`Geocoding ${next} via Open-Meteo…`);

    void fetchTips(geo, { geocode: true });

  };



  const retryLocation = () => {

    if (!navigator.geolocation) {

      setLocationNote("Geolocation is not supported in this browser.");

      return;

    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(

      (pos) => {

        const geo = { lat: pos.coords.latitude, lng: pos.coords.longitude, city };

        geoRef.current = geo;

        setLocationNote(null);

        void fetchTips(geo);

      },

      () => {

        setLocationNote("Location permission denied. Enter your city below.");

        void fetchTips(geoRef.current, { geocode: true });

      },

      { timeout: 8000, maximumAge: 0 }

    );

  };



  const refreshSuggestions = () => {

    void fetchTips(geoRef.current, { refresh: true });

  };



  if (loading && !data && !weatherUnavailable) {

    return (

      <div className="rounded-3xl bg-[#0f0f0f] border border-white/8 p-5 animate-pulse">

        <div className="h-5 w-40 bg-white/5 rounded-full mb-3" />

        <div className="h-4 bg-white/5 rounded-full" />

        <div className="h-4 bg-white/5 rounded-full mt-2 w-3/4" />

      </div>

    );

  }



  if (weatherUnavailable) {

    return (

      <section className="rounded-3xl bg-gradient-to-br from-purple-950/30 via-[#0c0c0c] to-pink-950/20 border border-white/8 p-5 space-y-4">

        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">

          <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />

          <div className="space-y-2 flex-1">

            <p className="font-semibold text-white">Weather unavailable</p>

            <p className="text-sm text-white/50">

              We couldn&apos;t fetch live conditions from Open-Meteo. No guessed temperatures are shown.

            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">

              <input

                value={manualCity}

                onChange={(e) => setManualCity(e.target.value)}

                placeholder={`Try a city (e.g. ${profileCity ?? DEFAULT_CITY})`}

                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30"

              />

              <button

                type="button"

                onClick={applyManualCity}

                className="shrink-0 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-white hover:bg-white/15"

              >

                Retry

              </button>

            </div>

          </div>

        </div>

      </section>

    );

  }



  if (!data) return null;



  const WIcon = iconForCode(data.weather.weatherCode);

  const unit = data.weatherMeta?.temperatureUnit ?? "°C";



  return (

    <section className="rounded-3xl bg-gradient-to-br from-purple-950/30 via-[#0c0c0c] to-pink-950/20 border border-white/8 p-5 space-y-4 relative overflow-hidden">

      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/8 blur-[100px] pointer-events-none" />



      <div className="relative flex flex-col sm:flex-row sm:items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">

        <MapPin className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />

        <div className="flex-1 space-y-2 min-w-0">

          {locationNote && (

            <p className="text-[11px] text-white/55 leading-relaxed">{locationNote}</p>

          )}

          <div className="flex flex-col sm:flex-row gap-2">

            <input

              value={manualCity}

              onChange={(e) => setManualCity(e.target.value)}

              placeholder={`City (default: ${profileCity ?? DEFAULT_CITY})`}

              className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30"

            />

            <button

              type="button"

              onClick={applyManualCity}

              className="shrink-0 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-white hover:bg-white/15"

            >

              Use city

            </button>

            <button

              type="button"

              onClick={retryLocation}

              className="shrink-0 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-purple-500/15 border border-purple-500/25 text-xs font-semibold text-purple-200 hover:bg-purple-500/25"

            >

              <LocateFixed className="w-3.5 h-3.5" />

              Retry GPS

            </button>

          </div>

        </div>

      </div>



      <div className="relative flex items-start justify-between gap-3">

        <div className="min-w-0">

          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 uppercase tracking-widest">

            <Sparkles className="w-3.5 h-3.5" />

            Today on LookFinesse

          </div>

          <h2 className="mt-1 text-xl font-bold text-white">

            {data.weather.city} · {data.weather.temperatureC}{unit}

          </h2>

          {prefsSummary && (

            <p className="text-[12px] text-purple-200/80 mt-1">

              For you: {prefsSummary}

            </p>

          )}

          {needsOnboarding && (

            <Link href="/onboarding" className="inline-block mt-2 text-[11px] font-semibold text-amber-200 hover:text-amber-100 underline">

              Complete onboarding for personalized tips

            </Link>

          )}

          <p className="text-[12px] text-white/40 flex items-center gap-1 mt-0.5 flex-wrap">

            <MapPin className="w-3 h-3 shrink-0" />

            {data.weather.description}

            {data.weather.high != null && data.weather.low != null && (

              <span>· H {data.weather.high}{unit} / L {data.weather.low}{unit}</span>

            )}

          </p>

          {data.weatherMeta?.attribution && (

            <p className="text-[10px] text-white/25 mt-1">{data.weatherMeta.attribution}</p>

          )}

        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">

            <WIcon className="w-7 h-7 text-yellow-300" />

          </div>

          <button

            type="button"

            onClick={refreshSuggestions}

            disabled={refreshing}

            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50"

          >

            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />

            New suggestions

          </button>

        </div>

      </div>



      <p className="relative text-sm text-white/70 leading-relaxed">{data.summary}</p>



      <div className="relative grid gap-3 md:grid-cols-3">

        {data.tips.map((tip) => {

          const Icon = ICONS[tip.category];

          return (

            <div

              key={tip.category}

              className={`bg-gradient-to-br ${COLORS[tip.category]} border rounded-2xl p-4 flex flex-col gap-2`}

            >

              <div className="flex items-center gap-2">

                <Icon className="w-4 h-4 text-white/80" />

                <p className="font-semibold text-white text-sm">{tip.title}</p>

              </div>

              <p className="text-[12px] text-white/60 leading-relaxed flex-1">{tip.body}</p>

              <div className="grid grid-cols-2 gap-1.5 mt-1">

                <Link

                  href={tip.productHref}

                  className="flex items-center justify-center gap-1 bg-white text-black text-[11px] font-semibold py-1.5 rounded-lg hover:bg-white/90"

                >

                  <ShoppingBag className="w-3 h-3" />

                  Shop

                </Link>

                <Link

                  href={tip.serviceHref}

                  className="flex items-center justify-center gap-1 bg-white/10 border border-white/15 text-white text-[11px] font-semibold py-1.5 rounded-lg hover:bg-white/15"

                >

                  Book

                  <ArrowRight className="w-3 h-3" />

                </Link>

              </div>

            </div>

          );

        })}

      </div>

    </section>

  );

}

