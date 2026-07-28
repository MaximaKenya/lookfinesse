"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { DEMO_PRODUCTS } from "@/lib/social/queries";
import Pagination, { getPageSlice } from "@/components/ui/Pagination";
import ShopCategoryBar from "@/components/shop/ShopCategoryBar";
import SearchInput from "@/components/ui/SearchInput";

import {
  SHOP_CATEGORY_OPTIONS,
  CATEGORY_HEADERS,
} from "@/lib/categories/canonical";

const CATEGORIES = SHOP_CATEGORY_OPTIONS;

const PRICE_RANGES = [
  { value: "all", label: "Any Price" },
  { value: "0-1000", label: "Under KES 1,000" },
  { value: "1000-3000", label: "KES 1,000 – 3,000" },
  { value: "3000-6000", label: "KES 3,000 – 6,000" },
  { value: "6000+", label: "Over KES 6,000" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

function filterDemoProducts(
  category: string,
  search: string,
  priceRange: string,
  sort: string
) {
  let demo = [...DEMO_PRODUCTS];
  if (category !== "all") demo = demo.filter((p) => p.category === category);
  if (search) demo = demo.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  if (priceRange !== "all") {
    const [min, max] = priceRange.replace("+", "-99999").split("-").map(Number);
    demo = demo.filter((p) => p.price >= min && (max === 99999 || p.price <= max));
  }
  if (sort === "price_asc") demo.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") demo.sort((a, b) => b.price - a.price);
  return demo;
}

function ProductCard({ product }: { product: any }) {
  const image = product.image_url || product.images?.[0] || null;
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:scale-[1.01]">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#111]">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-40">🛍️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white/70">
                Sold Out
              </span>
            </div>
          )}
          {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <div className="absolute left-2 top-2 rounded-full bg-orange-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
              {product.stock_quantity} left
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
              <span className="truncate text-[10px] text-white/35">{product.stores.name}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [priceRange, setPriceRange] = useState(searchParams.get("price") ?? "all");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 24;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("id, name, price, image_url, images, category, stock_quantity, stores(name)", {
        count: "exact",
      })
      .eq("is_active", true);

    if (category !== "all") query = query.eq("category", category);
    if (search) query = query.ilike("name", `%${search}%`);

    if (priceRange !== "all") {
      const [min, max] = priceRange.replace("+", "-99999").split("-").map(Number);
      query = query.gte("price", min);
      if (max !== 99999) query = query.lte("price", max);
    }

    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    query = query.limit(120);

    const { data, error, count } = await query;
    let result = !error && data?.length ? data : filterDemoProducts(category, search, priceRange, sort);
    if (!error && data?.length) result = data;
    else if (error || !data?.length) result = filterDemoProducts(category, search, priceRange, sort);

    setProducts(result);
    setTotal(count && count > 0 ? count : result.length);
    setLoading(false);
  }, [category, priceRange, sort, search]);

  useEffect(() => {
    setPage(1);
    fetchProducts();
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (priceRange !== "all") params.set("price", priceRange);
    if (sort !== "newest") params.set("sort", sort);
    if (search) params.set("q", search);
    router.replace(`/shop${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }, [category, priceRange, sort, search, fetchProducts, router]);

  const { slice, totalPages } = getPageSlice(products, page, PAGE_SIZE);

  const clearFilters = () => {
    setCategory("all");
    setPriceRange("all");
    setSort("newest");
    setSearch("");
  };

  const hasFilters = category !== "all" || priceRange !== "all" || sort !== "newest" || search;
  const catHeader = category !== "all" ? CATEGORY_HEADERS[category] : null;

  return (
    <section className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 bg-purple-500/8 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 bg-rose-500/8 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/50">
            <Sparkles className="h-3 w-3 text-purple-400" />
            LookFinesse Shop
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {catHeader ? catHeader.title : "Shop"}
          </h1>
          <p className="max-w-lg text-sm text-white/50">
            {catHeader
              ? catHeader.subtitle
              : loading
                ? "Loading…"
                : `${total} product${total !== 1 ? "s" : ""} from verified creators`}
          </p>
        </header>

        <ShopCategoryBar category={category} onChange={setCategory} />

        <div className="flex gap-2">
          <SearchInput
            className="flex-1"
            value={search}
            onChange={setSearch}
            placeholder="Search products…"
            debounceMs={250}
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
              hasFilters
                ? "border-purple-500/30 bg-purple-500/15 text-purple-300"
                : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasFilters && <span className="h-2 w-2 shrink-0 rounded-full bg-purple-400" />}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-5 rounded-3xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                        category === c.value
                          ? "bg-white text-black"
                          : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Price</p>
                <div className="space-y-1.5">
                  {PRICE_RANGES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriceRange(p.value)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-all ${
                        priceRange === p.value
                          ? "bg-white/10 font-medium text-white"
                          : "text-white/50 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Sort</p>
                <div className="space-y-1.5">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSort(s.value)}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-all ${
                        sort === s.value
                          ? "bg-white/10 font-medium text-white"
                          : "text-white/50 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-3xl border border-white/5 bg-[#0f0f0f]"
              >
                <div className="aspect-[4/5] bg-white/5" />
                <div className="space-y-2 p-4">
                  <div className="h-4 rounded-full bg-white/5" />
                  <div className="h-4 w-2/3 rounded-full bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-24 text-center">
            <div className="text-5xl">{catHeader?.emoji ?? "🛍️"}</div>
            <p className="mt-4 text-lg font-medium text-white/50">No products in this category</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/30">
              {category === "jeans"
                ? "Try clearing filters or browse all fashion — new denim drops land weekly."
                : "Adjust filters or explore trending creators."}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm text-purple-300 underline underline-offset-2 hover:text-purple-200"
              >
                Clear filters
              </button>
            )}
            <Link
              href="/explore"
              className="mt-4 inline-block rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-black"
            >
              Explore creators
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {slice.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} className="pt-6" />
          </>
        )}
      </div>
    </section>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
