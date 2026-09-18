import { supabase } from "./supabaseClient";

export const getNearbyStores = async (lat: number, lng: number, radiusKm = 25) => {
  const { data, error } = await supabase.rpc("nearby_vendors", {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
  });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};
