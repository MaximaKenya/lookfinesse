"use client";

import Link from "next/link";
import ProductImage from "./ProductImage";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number | string;
    image_url?: string | null;
    images?: string[] | null;
    category?: string | null;
    stock_quantity?: number | null;
    stock?: number | null;
    stores?: { name?: string | null } | null;
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  const image =
    product.image_url ||
    (Array.isArray(product.images) ? product.images[0] : null) ||
    null;
  const stock =
    product.stock_quantity ?? product.stock ?? null;
  const soldOut = stock !== null && stock <= 0;
  const lowStock = stock !== null && stock > 0 && stock <= 5;

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:scale-[1.01]">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#111]">
          {image ? (
            <ProductImage
              src={image}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-40">
              🛍️
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/70">
                Sold Out
              </span>
            </div>
          )}
          {lowStock && (
            <div className="absolute left-2 top-2 rounded-full bg-orange-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
              {stock} left
            </div>
          )}
          {product.category && (
            <span className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] capitalize text-white/80 backdrop-blur-sm">
              {product.category}
            </span>
          )}
        </div>
        <div className="space-y-1 p-4">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-white group-hover:text-purple-200 transition-colors">
            {product.name}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-white">
              KES {Number(product.price).toLocaleString()}
            </span>
            {product.stores?.name && (
              <span className="truncate text-[10px] text-white/35">
                {product.stores.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
