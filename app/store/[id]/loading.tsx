export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-44 animate-pulse rounded-3xl bg-white/5" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
