export default function FeedLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-5 animate-pulse">
      <div className="h-8 w-32 bg-white/5 rounded-full" />
      <div className="h-40 bg-white/5 rounded-3xl" />
      <div className="h-48 bg-white/5 rounded-3xl" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-72 bg-white/5 rounded-3xl" />
      ))}
    </div>
  );
}
