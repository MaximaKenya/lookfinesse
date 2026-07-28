import { supabase } from "./supabaseClient";
import { DEMO_PRODUCTS } from "./social/queries";

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

function normalizeDemoProduct(p: (typeof DEMO_PRODUCTS)[number]) {
  return {
    ...p,
    store_id: null,
    description:
      `Curated by ${p.stores?.name ?? "LookFinesse"}. Demo product — connect Supabase and seed.sql to manage real inventory.`,
    stock: p.stock_quantity,
    images: [p.image_url],
  };
}

// ======================
// GET SINGLE PRODUCT
// ======================
export async function getProduct(id: string) {
  if (id.startsWith("demo-")) {
    const demo = DEMO_PRODUCTS.find((p) => p.id === id);
    return demo ? normalizeDemoProduct(demo) : null;
  }

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
  if (!storeId || currentId.startsWith("demo-")) {
    return DEMO_PRODUCTS
      .filter((p) => p.id !== currentId)
      .slice(0, 4)
      .map((p) => normalizeDemoProduct(p));
  }

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
