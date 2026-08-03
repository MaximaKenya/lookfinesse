import { getProduct, getRelatedProducts } from "@/lib/marketplace";
import { getServices } from "@/lib/social/queries";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import ProductVariantPicker from "@/components/shop/ProductVariantPicker";
import Link from "next/link";
import { ProductWhatsAppShare } from "@/components/commerce/WhatsAppCommerce";

export default async function ProductPage({ params }: any) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) return notFound();

  const product = await getProduct(id);
  if (!product) return notFound();

  const [related, allServices] = await Promise.all([
    getRelatedProducts(product.store_id ?? null, product.id),
    getServices(),
  ]);

  const category = product.category ?? "wellness";
  const relatedServices = (allServices as any[])
    .filter((s) => s.category === category || category === "fitness" && s.category === "fitness")
    .slice(0, 3);

  const images = [
    product.image_url,
    ...(Array.isArray(product.images) ? product.images : []),
  ].filter(Boolean);

  const inStock = (product.stock ?? 0) > 0;
  const hasDiscount =
    product.original_price &&
    Number(product.original_price) > Number(product.price);
  const discountPct = hasDiscount
    ? Math.round(
        ((Number(product.original_price) - Number(product.price)) /
          Number(product.original_price)) *
          100
      )
    : 0;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[500px] bg-purple-600/10 blur-[180px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[400px] bg-pink-500/8 blur-[180px] pointer-events-none" />
      <div className="fixed top-1/2 right-1/4 w-[300px] h-[300px] bg-cyan-500/6 blur-[140px] pointer-events-none" />

      {/* ── STICKY HEADER ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0f0f0f]/80 backdrop-blur-2xl border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/shop"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Shop
          </Link>

          <span className="text-white/15">/</span>
          <span className="text-gray-500 text-sm truncate max-w-[200px]">{product.name}</span>

          <div className="flex-1" />

          {inStock ? (
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              In Stock
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Sold Out
            </span>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-20">

        {/* ── MAIN HERO GRID ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 lg:gap-14 items-start">

          {/* LEFT: Gallery — sticky on desktop */}
          <div className="lg:sticky lg:top-20">
            <ProductGallery images={images} />
          </div>

          {/* RIGHT: Info panel */}
          <div className="flex flex-col gap-7">

            {/* ── VENDOR STRIP ── */}
            {product.stores?.name && (
              <Link href={`/store/${product.store_id}`} className="group block">
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/4 border border-white/8 hover:border-white/16 hover:bg-white/6 transition-all duration-200">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-500/20 flex-shrink-0">
                    {product.stores.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{product.stores.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Official Store · Verified</p>
                  </div>
                  <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}

            {/* ── TITLE + DESCRIPTION ── */}
            <div className="space-y-4">
              {discountPct > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {discountPct}% OFF
                </span>
              )}

              <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                {product.name}
              </h1>

              {product.description && (
                <p className="text-[15px] text-gray-400 leading-[1.8] font-normal">
                  {product.description}
                </p>
              )}
            </div>

            {/* ── PRICE ── */}
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                KES {Number(product.price).toLocaleString()}
              </span>
              {hasDiscount && (
                <div className="flex flex-col mb-1">
                  <span className="text-lg text-gray-600 line-through leading-none">
                    KES {Number(product.original_price).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-600 mt-0.5">
                    You save KES {(Number(product.original_price) - Number(product.price)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* ── VARIANTS ── */}
            <ProductVariantPicker category={category} />

            {/* ── CTA BUTTONS ── */}
            <div className="space-y-3">
              <Link
                href={inStock ? `/checkout?product=${product.id}` : "#"}
                className={`relative flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-bold text-[15px] tracking-wide transition-all duration-200 overflow-hidden
                  ${
                    inStock
                      ? "bg-white text-black hover:bg-gray-100 active:scale-[0.98] shadow-xl shadow-white/10"
                      : "bg-white/8 text-gray-600 cursor-not-allowed pointer-events-none"
                  }`}
              >
                {inStock && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                )}
                <svg className="w-5 h-5 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="relative">{inStock ? "Buy Now" : "Out of Stock"}</span>
              </Link>

              <AddToCartButton product={product} />
              <div className="pt-1">
                <ProductWhatsAppShare
                  name={product.name}
                  priceKes={Number(product.price)}
                  productId={product.id}
                  vendorName={product.stores?.name}
                />
              </div>
            </div>

            {/* ── STOCK + SKU INFO ── */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium ${
                inStock
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-green-400" : "bg-red-400"}`} />
                {inStock ? `${product.stock} in stock` : "Out of stock"}
              </div>
            </div>

            {/* ── TRUST SIGNALS ── */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                  label: "Secure",
                  sub: "M-Pesa & card",
                  color: "text-purple-400",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  ),
                  label: "Shipping",
                  sub: "Nairobi 1–3 days",
                  color: "text-cyan-400",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ),
                  label: "Returns",
                  sub: "7-day policy",
                  color: "text-pink-400",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-white/3 border border-white/8 text-center"
                >
                  <span className={item.color}>{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{item.label}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping & returns detail */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-3 text-sm text-gray-400">
              <div>
                <p className="font-semibold text-white text-sm mb-1">Shipping</p>
                <p className="leading-relaxed">
                  Standard delivery across Nairobi in 1–3 business days. Nationwide shipping
                  available at checkout — rates shown before you pay.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white text-sm mb-1">Returns</p>
                <p className="leading-relaxed">
                  Unopened items may be returned within 7 days. Contact the vendor via your
                  order page for exchanges on sizing or defects.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── RELATED SERVICES ───────────────────────────────────── */}
        {relatedServices.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Book related services</h2>
              <p className="text-gray-600 text-sm mt-1">Complete your look with local pros</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {relatedServices.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/services/${s.id}`}
                  className="bg-white/3 border border-white/8 rounded-3xl overflow-hidden hover:border-white/20 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.cover_image || "/placeholder.png"}
                    alt=""
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-4 space-y-1">
                    <p className="font-semibold text-sm text-white line-clamp-2">{s.title}</p>
                    <p className="text-white font-bold text-sm">
                      KES {Number(s.price).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── RELATED PRODUCTS ─────────────────────────────────── */}
        {related.length > 0 && (
          <div className="space-y-6">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">More from this store</h2>
                <p className="text-gray-600 text-sm mt-1">You might also like</p>
              </div>
              <Link
                href={`/store/${product.store_id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 text-sm text-gray-300 transition-all duration-200"
              >
                View all
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Horizontal scroll carousel */}
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
              {related.map((p: any) => {
                const relInStock = (p.stock ?? 0) > 0;
                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className="flex-none w-48 snap-start group"
                  >
                    <div className="bg-white/3 border border-white/8 rounded-3xl overflow-hidden hover:border-white/20 hover:bg-white/5 transition-all duration-200 hover:scale-[1.02]">
                      <div className="relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image_url || "/placeholder.png"}
                          alt={p.name}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {!relInStock && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 border border-white/10 text-[10px] text-gray-400 backdrop-blur-sm">
                            Sold out
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-1.5">
                        <p className="font-semibold text-sm truncate text-white">{p.name}</p>
                        <p className="font-bold text-base text-white">
                          KES {Number(p.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Mobile sticky buy bar */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-40 border-t border-white/10 bg-[#0f0f0f]/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3 safe-area-inset-bottom">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{product.name}</p>
          <p className="text-lg font-bold text-white">
            KES {Number(product.price).toLocaleString()}
          </p>
        </div>
        <Link
          href={inStock ? `/checkout?product=${product.id}` : "#"}
          className={`shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm ${
            inStock ? "bg-white text-black" : "bg-white/10 text-gray-500 pointer-events-none"
          }`}
        >
          {inStock ? "Buy" : "Sold out"}
        </Link>
      </div>
    </div>
  );
}
