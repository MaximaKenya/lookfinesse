import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";
import { getStore } from "@/lib/marketplace";
import ProductCard from "@/components/ProductCard";

export default async function StorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await getStore(id);

  if (!store) notFound();

  const products = store.products ?? [];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed top-0 left-1/4 h-[420px] w-[420px] rounded-full bg-purple-600/15 blur-[140px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-rose-500/10 blur-[120px]" />

      <header className="sticky top-0 z-40 border-b border-white/8 bg-black/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Shop
          </Link>
          <span className="text-white/15">/</span>
          <span className="truncate text-sm text-white/60">{store.name}</span>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          {store.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.banner_url}
              alt=""
              className="h-44 w-full object-cover sm:h-56"
            />
          ) : (
            <div className="flex h-36 items-center justify-center bg-gradient-to-br from-purple-900/40 via-black to-rose-900/30 sm:h-44">
              <Store className="h-10 w-10 text-white/25" />
            </div>
          )}

          <div className="space-y-3 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {store.name}
                </h1>
                {store.description ? (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
                    {store.description}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-white/40">
                    Official LookFinesse storefront
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-center">
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/40">
                  Products
                </p>
              </div>
            </div>
          </div>
        </section>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-20 text-center">
            <p className="text-lg font-medium text-white/50">No products yet</p>
            <p className="mt-2 text-sm text-white/30">
              Check back soon or browse the full shop.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-2xl bg-white px-6 py-2.5 text-sm font-semibold text-black"
            >
              Browse shop
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Products</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
