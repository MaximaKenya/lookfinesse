"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

type Point = {
  id: string;
  lat: number;
  lng: number;
  name?: string;
};

const DARK_STYLES: Array<{ elementType?: string; featureType?: string; stylers: Array<Record<string, string>> }> = [
  { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
  { featureType: "water", stylers: [{ color: "#0e1624" }] },
  { featureType: "road", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];

export default function NearbyMap({
  origin,
  points,
}: {
  origin: { lat: number; lng: number };
  points: Point[];
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: key,
    preventGoogleFontsLoading: true,
  });

  if (!key || loadError) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3 text-sm text-white/55">
        <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          Map preview needs <code className="text-white/80">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
          Distances below still use GPS / Nairobi fallback.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="h-56 rounded-2xl bg-white/5 animate-pulse" aria-hidden />;
  }

  return (
    <GoogleMap
      zoom={12}
      center={origin}
      mapContainerClassName="w-full h-56 rounded-2xl overflow-hidden border border-white/10"
      options={{ disableDefaultUI: true, zoomControl: true, styles: DARK_STYLES as never }}
    >
      <Marker position={origin} />
      {points
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .slice(0, 20)
        .map((p) => (
          <Marker key={p.id} position={{ lat: p.lat, lng: p.lng }} title={p.name} />
        ))}
    </GoogleMap>
  );
}
