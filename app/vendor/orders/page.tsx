"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  ArrowUpRight,
  ChevronRight,
  Filter,
  PackageSearch,
  ShoppingBag,
  Truck,
} from "lucide-react";
import HorizontalFilterScroller from "@/components/ui/HorizontalFilterScroller";

type Order = {
  id: string;
  total?: number;
  total_amount?: number;
  status: string;
  created_at: string;
  customer_name?: string;
  product_id?: string;
  vendor_id?: string;
};

const STATUS_TONES: Record<string, string> = {
  paid: "bg-green-500/15 text-green-300 border-green-500/20",
  completed: "bg-green-500/15 text-green-300 border-green-500/20",
  pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",
  failed: "bg-red-500/15 text-red-300 border-red-500/20",
  refunded: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  cancelled: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20",
};

const FILTERS = ["all", "pending", "paid", "completed", "refunded", "failed"];

function formatAmount(o: Order) {
  return Number(o.total ?? o.total_amount ?? 0);
}

export default function VendorOrdersPage() {
  const { userId, loading: userLoading } = useCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        let query = supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (userId) {
          const { data: vendor } = await supabase
            .from("vendors")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
          query = query.eq("vendor_id", vendor?.id ?? userId);
        }

        const { data } = await query;
        if (!mounted) return;
        setOrders((data as Order[]) || []);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [userId, userLoading]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const totals = useMemo(() => {
    const paid = orders.filter(
      (o) => o.status === "paid" || o.status === "completed"
    );
    const pending = orders.filter((o) => o.status === "pending");
    const refunded = orders.filter((o) => o.status === "refunded");

    const revenue = paid.reduce((acc, o) => acc + formatAmount(o), 0);

    return {
      revenue,
      count: orders.length,
      paid: paid.length,
      pending: pending.length,
      refunded: refunded.length,
    };
  }, [orders]);

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <Truck className="h-3.5 w-3.5" />
              Orders & Fulfillment
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Vendor Orders
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Track incoming purchases, manage fulfillment status, escalate
              disputes and reconcile with payouts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
            <Link
              href="/vendor/products"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              <ShoppingBag className="h-4 w-4" />
              Product Studio
            </Link>
            <Link
              href="/vendor/finance"
              className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/20"
            >
              Finance Center
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Link
            href="/vendor/finance"
            className="rounded-3xl border border-green-500/20 bg-green-500/5 p-5 hover:bg-green-500/10 transition"
          >
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              Revenue (paid)
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              KES {totals.revenue.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">
              Open finance center →
            </div>
          </Link>
          <Link
            href="/vendor/orders"
            className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 hover:bg-cyan-500/10 transition"
          >
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              Total Orders
            </div>
            <div className="mt-2 text-3xl font-black text-white">{totals.count}</div>
            <div className="mt-1 text-[11px] text-zinc-500">All statuses</div>
          </Link>
          <button
            onClick={() => setFilter("pending")}
            className="text-left rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5 hover:bg-yellow-500/10 transition"
          >
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              Pending
            </div>
            <div className="mt-2 text-3xl font-black text-yellow-300">
              {totals.pending}
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">Click to filter</div>
          </button>
          <button
            onClick={() => setFilter("refunded")}
            className="text-left rounded-3xl border border-purple-500/20 bg-purple-500/5 p-5 hover:bg-purple-500/10 transition"
          >
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              Refunded
            </div>
            <div className="mt-2 text-3xl font-black text-purple-300">
              {totals.refunded}
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">Click to filter</div>
          </button>
        </section>

        {/* FILTERS */}
        <section className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500 shrink-0" />
          <HorizontalFilterScroller ariaLabel="Order status filters" className="flex-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`snap-start shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition ${
                  filter === f
                    ? "bg-white text-black"
                    : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                {f}
              </button>
            ))}
          </HorizontalFilterScroller>
        </section>

        {/* ORDERS TABLE */}
        <section className="rounded-3xl border border-white/8 bg-zinc-950/60 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-sm">
              Loading orders…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-3">
              <PackageSearch className="h-10 w-10 mx-auto text-zinc-700" />
              <p>No orders match this filter yet.</p>
              <Link
                href="/vendor/products"
                className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:underline"
              >
                Create a new product to start selling
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((o) => {
                const tone =
                  STATUS_TONES[o.status] ??
                  "bg-zinc-500/15 text-zinc-300 border-zinc-500/20";
                return (
                  <Link
                    key={o.id}
                    href={`/order/${o.id}`}
                    className="grid grid-cols-12 items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition"
                  >
                    <div className="col-span-12 md:col-span-4">
                      <div className="text-sm font-semibold truncate">
                        Order {o.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">
                        {o.customer_name ?? "Marketplace buyer"}
                      </div>
                    </div>
                    <div className="col-span-6 md:col-span-3 text-xs text-zinc-400">
                      {new Date(o.created_at).toLocaleString("en-KE", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="col-span-3 md:col-span-2 text-sm font-semibold">
                      KES {formatAmount(o).toLocaleString()}
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${tone}`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <div className="hidden md:flex md:col-span-1 justify-end text-zinc-500">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
