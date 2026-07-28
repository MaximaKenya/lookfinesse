"use client";

type Props = {
  booked: number;
  max: number;
  className?: string;
  label?: string;
};

export default function CapacityMeter({ booked, max, className = "", label }: Props) {
  const safeMax = Math.max(1, max);
  const safeBooked = Math.min(Math.max(0, booked), safeMax);
  const pct = Math.round((safeBooked / safeMax) * 100);
  const remaining = Math.max(0, safeMax - safeBooked);
  const full = remaining <= 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-white/60">
          {label ?? "Capacity"}
        </span>
        <span className={`font-semibold ${full ? "text-red-300" : "text-white/80"}`}>
          {safeBooked} of {safeMax} spots booked
          {!full && ` · ${remaining} left`}
          {full && " · Full"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            full ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-cyan-500 to-purple-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
