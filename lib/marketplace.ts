import { supabase } from "./supabaseClient";

// ======================
// GET ALL PRODUCTS (FEED)
// ======================
export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      price,
      image_url,
      images,
      stores ( id, name )
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return [];
  }

  return (data || []).map((p: any) => ({
    ...p,
    image_url:
      p.image_url ||
      (Array.isArray(p.images) ? p.images[0] : null),
  }));
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      stores ( id, name )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("GET PRODUCT ERROR:", error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    image_url:
      data.image_url ||
      (Array.isArray(data.images) ? data.images[0] : null),
  };
}

export async function getRelatedProducts(storeId: string | null, currentId: string) {
  if (!storeId) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, image_url, images")
    .eq("store_id", storeId)
    .neq("id", currentId)
    .limit(4);

  if (error) {
    console.error(error);
    return [];
  }

  return (data || []).map((p: any) => ({
    ...p,
    image_url:
      p.image_url ||
      (Array.isArray(p.images) ? p.images[0] : null),
  }));
}

export async function getStore(id: string) {
  const { data: store, error } = await supabase
    .from("stores")
    .select(`
      *,
      products ( id, name, price, image_url, images )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !store) return null;

  return {
    ...store,
    products: (store.products || []).map((p: any) => ({
      ...p,
      image_url: p.image_url || (Array.isArray(p.images) ? p.images[0] : null),
    })),
  };
}
