"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SearchInput from "@/components/ui/SearchInput";
import { useVendorContext } from "@/hooks/useVendorContext";

type VendorProduct = {
  id: string;
  name: string;
  price?: number;
  image_url?: string;
  status?: string;
  category?: string;
};

export default function VendorProductsList() {
  const { vendorId } = useVendorContext();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/vendor/products")
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d.products) ? d.products : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.status ?? "").toLowerCase().includes(q)
    );
  }, [products, query]);

  if (loading) {
    return (
      <div className="rounded-[32px] border border-zinc-800 bg-zinc-900 p-8 animate-pulse h-40" />
    );
  }

  return (
    <div className="rounded-[32px] border border-zinc-800 bg-zinc-900 p-8 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Your products</h2>
        <span className="text-sm text-zinc-400">{products.length} total</span>
      </div>
      <SearchInput onChange={setQuery} placeholder="Search your products…" />
      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm py-6 text-center">
          {query ? "No products match your search" : "No products listed yet"}
        </p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                href={`/product/${p.id}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 p-3 hover:border-zinc-600 transition-all"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                  {p.image_url && (
                    <Image src={p.image_url} alt="" fill className="object-cover" unoptimized />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-zinc-500 capitalize">
                    {p.category ?? "product"} · {p.status ?? "active"}
                  </p>
                </div>
                {p.price != null && (
                  <span className="text-sm font-bold text-cyan-300 shrink-0">
                    KES {Number(p.price).toLocaleString()}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
