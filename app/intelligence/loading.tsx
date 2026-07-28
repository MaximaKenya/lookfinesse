export default function IntelligenceLoading() {
  return (
    <div className="min-h-screen bg-black p-6 md:p-8 animate-pulse space-y-6">
      <div className="h-12 w-80 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-3xl" />
        ))}
      </div>
      <div className="h-80 bg-white/5 rounded-3xl" />
    </div>
  );
}
