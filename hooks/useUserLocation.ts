"use client";

import { useCallback, useEffect, useState } from "react";
import { NAIROBI } from "@/lib/geo/haversine";

export type GeoStatus = "idle" | "prompt" | "granted" | "denied" | "unavailable" | "fallback";

export type UserLocation = {
  lat: number;
  lng: number;
  city?: string;
  usingFallback: boolean;
};

const STORAGE_KEY = "lf_last_location";

function readStored(): UserLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function persist(loc: UserLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {
    /* ignore */
  }
}

export function useUserLocation(opts?: { auto?: boolean }) {
  const auto = opts?.auto !== false;
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyFallback = useCallback((reason: GeoStatus, message: string) => {
    const stored = readStored();
    const loc: UserLocation = stored
      ? { ...stored, usingFallback: true }
      : { lat: NAIROBI.lat, lng: NAIROBI.lng, city: NAIROBI.city, usingFallback: true };
    setLocation(loc);
    setStatus(reason);
    setError(message);
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      applyFallback("unavailable", "Geolocation is not available in this browser.");
      return;
    }
    setStatus("prompt");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          usingFallback: false,
        };
        persist(loc);
        setLocation(loc);
        setStatus("granted");
        setError(null);
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        applyFallback(
          denied ? "denied" : "fallback",
          denied
            ? "Location permission denied. Showing Nairobi-area results."
            : "Could not read GPS. Showing Nairobi-area results."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 }
    );
  }, [applyFallback]);

  useEffect(() => {
    if (!auto) return;
    const stored = readStored();
    if (stored && !stored.usingFallback) {
      setLocation(stored);
      setStatus("granted");
    }
    request();
  }, [auto, request]);

  return { status, location, error, request, fallbackLabel: NAIROBI.label };
}
