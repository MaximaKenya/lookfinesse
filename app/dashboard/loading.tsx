export default function DashboardLoading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-10 w-64 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white/5 rounded-2xl" />
        ))}
      </div>
      <div className="h-96 bg-white/5 rounded-3xl" />
    </div>
  );
}
