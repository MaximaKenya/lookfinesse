"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useEffect, useState } from "react";

export default function NearMeStrip({
  kind,
}: {
  kind: "products" | "services";
}) {
  const { location, status, request } = useUserLocation({ auto: true });
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!location) return;
    const qs = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      kind,
      radius: "15",
    });
    fetch(`/api/nearby?${qs}`)
      .then((r) => r.json())
      .then((d) => {
        const n = kind === "products" ? d.products?.length ?? d.places?.length : d.services?.length ?? d.places?.length;
        setCount(typeof n === "number" ? n : 0);
      })
      .catch(() => setCount(null));
  }, [location, kind]);

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
      <p className="text-sm text-white/70 flex-1">
        {status === "granted" && !location?.usingFallback
          ? count != null
            ? `${count} ${kind === "products" ? "products" : "bookable services"} within 15 km`
            : "Finding what's near you…"
          : "Turn on location to sort by distance from you."}
      </p>
      <div className="flex gap-2">
        {status !== "granted" && (
          <button
            type="button"
            onClick={request}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-cyan-500 text-black"
          >
            Use location
          </button>
        )}
        <Link
          href="/nearby"
          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15 text-white/80 hover:text-white"
        >
          Near me map
        </Link>
      </div>
    </div>
  );
}
