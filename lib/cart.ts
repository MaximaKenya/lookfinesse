import { supabase } from "./supabaseClient";

export async function addToCart(userId: string, productId: string) {
  const { error } = await supabase.from("cart_items").insert({
    user_id: userId,
    product_id: productId,
    quantity: 1,
  });

  if (error) console.error(error);
}

export async function getCart(userId: string) {
  const { data, error } = await supabase
    .from("cart_items")
    .select("*, products(*)")
    .eq("user_id", userId);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}