"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import type { Product } from "@/lib/types";

type MediaItem = {
  url: string;
  path?: string;
};

export default function ProductPageV2() {
  const router = useRouter();
  const { id } = useParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [description, setDescription] = useState("");

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // ======================
  // LOAD PRODUCT
  // ======================
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setProduct(data);

      setName(data.name);
      setPrice(data.price);
      setStock(data.stock);
      setDescription(data.description || "");

      const imgs = Array.isArray(data.images) ? data.images : [];

      const formatted = imgs.map((url: string) => ({ url }));
      setMedia(formatted);

      setActiveImage(imgs[0] || null);

      setLoading(false);
    };

    if (id) load();
  }, [id]);

  // ======================
  // DERIVED METRICS
  // ======================
  const stockStatus = useMemo(() => {
    if (stock <= 5) return "🔴 Critical stock";
    if (stock <= 20) return "🟡 Low stock";
    return "🟢 Healthy stock";
  }, [stock]);

  const priceTier = useMemo(() => {
    if (price < 20) return "Budget";
    if (price < 100) return "Mid-tier";
    return "Premium";
  }, [price]);

  const completionScore = useMemo(() => {
    let score = 0;
    if (name) score += 25;
    if (description) score += 25;
    if (price > 0) score += 25;
    if (media.length > 0) score += 25;
    return score;
  }, [name, description, price, media]);

  // ======================
  // SAVE CHANGES
  // ======================
  const saveChanges = async () => {
    if (!product) return;

    const { error } = await supabase
      .from("products")
      .update({
        name,
        price,
        stock,
        description,
        images: media.map((m) => m.url),
      })
      .eq("id", product.id);

    if (error) {
      alert(error.message);
      return;
    }

    setEditMode(false);
  };

  // ======================
  // DELETE PRODUCT
  // ======================
  const handleDelete = async () => {
    if (!product) return;

    const ok = confirm("Delete this product permanently?");
    if (!ok) return;

    await supabase.from("products").delete().eq("id", product.id);

    router.push("/dashboard");
  };

  // ======================
  // MEDIA REORDER
  // ======================
  const moveImage = (from: number, to: number) => {
    const updated = [...media];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setMedia(updated);
  };

  // ======================
  // LOADING
  // ======================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Product not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f11] via-[#111827] to-black text-white px-6 py-10">

      {/* TOP ACTION BAR */}
      <div className="flex justify-between items-center mb-6">

        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl border border-white/20"
        >
          ← Back
        </button>

        <div className="flex gap-2">

          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 rounded-xl bg-white text-black"
            >
              Edit Product
            </button>
          ) : (
            <button
              onClick={saveChanges}
              className="px-4 py-2 rounded-xl bg-green-500 text-white"
            >
              Save Changes
            </button>
          )}

          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-10">

        {/* LEFT: GALLERY */}
        <div>

          <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5">
            <img
              src={activeImage || "/placeholder.png"}
              className="w-full h-[420px] object-cover"
            />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-3">
            {media.map((m, i) => (
              <img
                key={i}
                src={m.url}
                onClick={() => setActiveImage(m.url)}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("from", i.toString())
                }
                onDrop={(e) => {
                  const from = Number(e.dataTransfer.getData("from"));
                  moveImage(from, i);
                }}
                onDragOver={(e) => e.preventDefault()}
                className="h-20 w-full object-cover rounded-xl cursor-pointer border border-white/10"
              />
            ))}
          </div>
        </div>

        {/* RIGHT: INFO */}
        <div className="space-y-6">

          {/* TITLE */}
          {editMode ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
            />
          ) : (
            <h1 className="text-4xl font-bold">{name}</h1>
          )}

          {/* DESCRIPTION */}
          {editMode ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
            />
          ) : (
            <p className="text-gray-400">{description}</p>
          )}

          {/* METRICS */}
          <div className="grid grid-cols-2 gap-3">

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400">Price</p>

              {editMode ? (
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-transparent text-xl font-bold"
                />
              ) : (
                <p className="text-xl font-bold">${price}</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400">Stock</p>

              {editMode ? (
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full bg-transparent text-xl font-bold"
                />
              ) : (
                <p className="text-xl font-bold">{stock}</p>
              )}
            </div>

          </div>

          {/* INTELLIGENCE PANEL */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <p className="text-sm">{stockStatus}</p>
            <p className="text-sm">Price Tier: {priceTier}</p>
            <p className="text-sm">Product Score: {completionScore}/100</p>
          </div>

          {/* BOOST PANEL */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-white/10">
            <p className="text-sm font-semibold">Boost Product 🚀</p>
            <p className="text-xs text-gray-300">
              Promote this product in future marketplace ads engine
            </p>
            <button className="mt-2 px-3 py-2 bg-white text-black rounded-xl text-sm">
              Boost now
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}