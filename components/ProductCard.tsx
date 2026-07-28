"use client";

import Link from "next/link";
import ProductImage from "./ProductImage";

export default function ProductCard({ product }: any) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group border rounded-2xl overflow-hidden bg-white hover:shadow-xl transition">
        
        <div className="w-full h-52 bg-gray-100 overflow-hidden">
          <ProductImage
            src={product.image_url}
            className="w-full h-full object-cover group-hover:scale-105 transition"
          />
        </div>

        <div className="p-3">
          <h2 className="font-semibold line-clamp-1">
            {product.name}
          </h2>

          <p className="text-xs text-gray-500">
            {product.stores?.name || "Store"}
          </p>

          <p className="mt-1 font-bold">
            KES {product.price}
          </p>
        </div>
      </div>
    </Link>
  );
}