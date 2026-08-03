"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Flame, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Drop = {
  id: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  sale_price?: number;
  currency?: string;
  status: string;
  hold_qty?: number;
  max_holds?: number;
  product_id?: string;
  products?: { id?: string; name?: string; image_url?: string | null; price?: number };
  vendors?: { name?: string; business_name?: string };
};

function countdown(target: string) {
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function DropsPage() {
  const { userId } = useCurrentUser();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/drops")
      .then((r) => r.json())
      .then((d) => setDrops(d.drops ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const live = useMemo(() => drops.filter((d) => d.status === "live"), [drops, tick]);
  const upcoming = useMemo(() => drops.filter((d) => d.status === "scheduled"), [drops, tick]);

  const joinWaitlist = async (dropId: string) => {
    if (!userId) {
      toast.error("Sign in to join the waitlist");
      return;
    }
    const res = await fetch("/api/drops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "waitlist", drop_id: dropId, user_id: userId }),
    });
    const data = await res.json();
    if (data.ok) toast.success("You're on the waitlist");
    else toast.error(data.error ?? "Could not join");
  };

  const hold = async (drop: Drop) => {
    if (!userId) {
      toast.error("Sign in to hold inventory");
      return;
    }
    const res = await fetch("/api/drops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "hold",
        drop_id: drop.id,
        product_id: drop.product_id ?? drop.products?.id,
        user_id: userId,
        qty: 1,
      }),
    });
    const data = await res.json();
    if (data.ok) toast.success("Held for 15 minutes — checkout soon");
    else toast.error(data.error ?? "Hold failed");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold mb-2">
          <Flame className="h-4 w-4" />
          Live shopping
        </div>
        <h1 className="text-3xl font-bold text-white">Flash drops</h1>
        <p className="text-white/50 mt-1 text-sm">
          Timed sales with countdown, waitlist, and short inventory holds.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm uppercase tracking-wider text-white/40 mb-3">Live now</h2>
            {live.length === 0 ? (
              <p className="text-white/30 text-sm">No live drops right now.</p>
            ) : (
              <div className="space-y-4">
                {live.map((d) => (
                  <DropCard
                    key={d.id}
                    drop={d}
                    timerLabel={`Ends in ${countdown(d.ends_at)}`}
                    onWaitlist={() => joinWaitlist(d.id)}
                    onHold={() => hold(d)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm uppercase tracking-wider text-white/40 mb-3">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-white/30 text-sm">No scheduled drops.</p>
            ) : (
              <div className="space-y-4">
                {upcoming.map((d) => (
                  <DropCard
                    key={d.id}
                    drop={d}
                    timerLabel={`Starts in ${countdown(d.starts_at)}`}
                    onWaitlist={() => joinWaitlist(d.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <p className="text-center text-sm text-white/30">
            Vendors:{" "}
            <Link href="/dashboard/create-drop" className="text-cyan-400 hover:underline">
              Schedule a drop
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

function DropCard({
  drop,
  timerLabel,
  onWaitlist,
  onHold,
}: {
  drop: Drop;
  timerLabel: string;
  onWaitlist: () => void;
  onHold?: () => void;
}) {
  const vendor = drop.vendors?.business_name || drop.vendors?.name || "Vendor";
  const product = drop.products?.name;
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/40">{vendor}</p>
          <h3 className="text-lg font-semibold text-white mt-0.5">{drop.title}</h3>
          {drop.description && <p className="text-sm text-white/50 mt-1">{drop.description}</p>}
          {product && (
            <p className="text-sm text-white/60 mt-2 flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" />
              {product}
            </p>
          )}
        </div>
        {drop.sale_price != null && (
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-white">
              {drop.currency ?? "KES"} {Number(drop.sale_price).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/30">
              {drop.hold_qty ?? 0}/{drop.max_holds ?? 50} held
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 text-orange-300 px-3 py-1 text-xs font-medium">
          <Clock className="h-3 w-3" />
          {timerLabel}
        </span>
        <button
          type="button"
          onClick={onWaitlist}
          className="rounded-full bg-white/10 hover:bg-white/15 px-3 py-1 text-xs font-medium text-white"
        >
          Join waitlist
        </button>
        {onHold && drop.status === "live" && (
          <button
            type="button"
            onClick={onHold}
            className="rounded-full bg-white text-black px-3 py-1 text-xs font-semibold"
          >
            Hold 15 min
          </button>
        )}
        {drop.products?.id && (
          <Link href={`/product/${drop.products.id}`} className="text-xs text-cyan-400 hover:underline ml-auto">
            View product
          </Link>
        )}
      </div>
    </article>
  );
}
