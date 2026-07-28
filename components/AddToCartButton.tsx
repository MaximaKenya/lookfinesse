"use client";

import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AddToCartButton({ product }: any) {
  const { add } = useCart();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      // Only persist when product.id is a real UUID (avoids errors on demo products)
      if (user?.user && product?.id && UUID_RE.test(product.id)) {
        await supabase.from("cart_items").insert({
          user_id: user.user.id,
          product_id: product.id,
          quantity: 1,
        });
      }
      add(product);
      setAdded(true);
      toast.success("Added to cart");
      setTimeout(() => setAdded(false), 1500);
    } catch {
      toast.error("Couldn't add to cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="flex items-center justify-center gap-1.5 flex-1 border border-white/15 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
    >
      {added ? <Check className="w-4 h-4 text-green-400" /> : <ShoppingBag className="w-4 h-4" />}
      {loading ? "Adding..." : added ? "Added!" : "Add to Cart"}
    </button>
  );
}
