import { supabase } from "./supabaseClient";

export const getNearbyStores = async (lat: number, lng: number) => {
  const { data, error } = await supabase.rpc("nearby_stores", {
    user_lat: lat,
    user_lng: lng,
  });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};