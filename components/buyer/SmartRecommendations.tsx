"use client";

import { useEffect, useState } from "react";

export default function SmartRecommendations() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        "/api/recommendations"
      );

      const json = await res.json();

      setProducts(json.products || []);
    }

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white">
          Recommended For You
        </h2>

        <p className="text-zinc-400 mt-2">
          AI-powered marketplace recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5"
          >
            <div className="aspect-square bg-zinc-900 rounded-2xl mb-4" />

            <div className="font-bold text-lg text-white">
              {product.title}
            </div>

            <div className="text-green-400 mt-2 font-semibold">
              KES {Number(product.price).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
