"use client";

import { useEffect, useState } from "react";
import { Bike, MapPin, Store } from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";

export type Fulfillment = "delivery" | "pickup";

export type DeliveryDetails = {
  fulfillment: Fulfillment;
  address: string;
  city: string;
  notes: string;
  lat: number | null;
  lng: number | null;
};

const STORAGE = "lf_delivery_details";

export function readDeliveryDetails(): DeliveryDetails {
  if (typeof window === "undefined") {
    return { fulfillment: "delivery", address: "", city: "Nairobi", notes: "", lat: null, lng: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw) as DeliveryDetails;
  } catch {
    /* ignore */
  }
  return { fulfillment: "delivery", address: "", city: "Nairobi", notes: "", lat: null, lng: null };
}

type NearbyVendor = { id: string; name: string; distance: string | null; eta: string | null };

export default function DeliveryPanel({
  hidden,
  onChange,
}: {
  hidden?: boolean;
  onChange: (d: DeliveryDetails) => void;
}) {
  const { location, request, status } = useUserLocation({ auto: true });
  const [details, setDetails] = useState<DeliveryDetails>(readDeliveryDetails);
  const [nearby, setNearby] = useState<NearbyVendor[]>([]);

  useEffect(() => {
    onChange(details);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(details));
    } catch {
      /* ignore */
    }
  }, [details, onChange]);

  useEffect(() => {
    if (!location) return;
    setDetails((d) => ({ ...d, lat: location.lat, lng: location.lng }));
    fetch(`/api/nearby?lat=${location.lat}&lng=${location.lng}&kind=deliveries&radius=15`)
      .then((r) => r.json())
      .then((d) => {
        setNearby(
          (d.deliveries ?? []).slice(0, 4).map((p: { id: string; name: string; distance?: string; eta?: string }) => ({
            id: p.id,
            name: p.name,
            distance: p.distance ?? null,
            eta: p.eta ?? null,
          }))
        );
      })
      .catch(() => setNearby([]));
  }, [location]);

  if (hidden) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-xl md:col-span-2">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Bike className="w-4 h-4 text-cyan-300" /> Fulfilment
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {(["delivery", "pickup"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setDetails((d) => ({ ...d, fulfillment: mode }))}
            className={`py-2.5 rounded-xl text-sm font-semibold border ${
              details.fulfillment === mode ? "bg-white text-black border-white" : "border-white/10 text-white/60"
            }`}
          >
            {mode === "delivery" ? "Delivery" : "Pickup"}
          </button>
        ))}
      </div>

      {details.fulfillment === "delivery" ? (
        <div className="space-y-3">
          <label className="text-xs text-white/40 uppercase tracking-wider">Delivery address</label>
          <input
            value={details.address}
            onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))}
            placeholder="Street, building, apartment"
            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none text-white placeholder-white/30"
          />
          <input
            value={details.city}
            onChange={(e) => setDetails((d) => ({ ...d, city: e.target.value }))}
            placeholder="City / area"
            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none text-white placeholder-white/30"
          />
          <textarea
            value={details.notes}
            onChange={(e) => setDetails((d) => ({ ...d, notes: e.target.value }))}
            placeholder="Gate code, landmark…"
            rows={2}
            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none text-white placeholder-white/30 resize-none"
          />
          <button type="button" onClick={request} className="text-xs text-cyan-300 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {status === "granted" ? "Location attached for ETA" : "Use my location for nearby delivery"}
          </button>
          {nearby.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/45">Vendors who can deliver to you</p>
              {nearby.map((v) => (
                <div key={v.id} className="flex items-center gap-2 text-xs text-white/70">
                  <Store className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="flex-1 truncate">{v.name}</span>
                  <span className="text-cyan-300">
                    {v.distance}
                    {v.eta ? ` · ${v.eta}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-white/50">
          You’ll pick up from the vendor storefront. Open{" "}
          <a href="/nearby" className="text-cyan-300 underline">
            Near me
          </a>{" "}
          for the closest shop.
        </p>
      )}
    </div>
  );
}
