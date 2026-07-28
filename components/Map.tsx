"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

type Store = {
  id: string;
  latitude: number;
  longitude: number;
};

export default function Map({ stores }: { stores: Store[] }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      zoom={12}
      center={{ lat: -1.2921, lng: 36.8219 }}
      mapContainerClassName="w-full h-96"
    >
      {stores.map((s) => (
        <Marker
          key={s.id}
          position={{ lat: s.latitude, lng: s.longitude }}
        />
      ))}
    </GoogleMap>
  );
}