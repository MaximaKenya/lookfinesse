export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        <div className="aspect-[4/5] animate-pulse rounded-3xl bg-white/5" />
        <div className="space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-xl bg-white/5" />
          <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-24 w-full animate-pulse rounded-2xl bg-white/5" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
