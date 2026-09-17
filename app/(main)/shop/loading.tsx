export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-full bg-white/5" />
        <div className="h-10 w-64 animate-pulse rounded-2xl bg-white/5" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-white/5 bg-[#0f0f0f]">
              <div className="aspect-[4/5] animate-pulse bg-white/5" />
              <div className="space-y-2 p-4">
                <div className="h-4 animate-pulse rounded-full bg-white/5" />
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
