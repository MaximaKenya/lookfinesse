"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User, Store, Product } from "@/lib/types";
import Link from "next/link";
import { signOutAndRedirect } from "@/lib/logout";
import ProductImage from "@/components/ProductImage";
import BrandLogo from "@/components/brand/BrandLogo";
import SubscriptionTierBadge from "@/components/vendor/SubscriptionTierBadge";
import TrialBanner from "@/components/vendor/TrialBanner";
import { VENDOR_KPI_LINKS } from "@/lib/nav/dashboards";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// ── Animated counter ──────────────────────────────────────────
function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const duration = 900;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}</span>;
}

// ── Recharts custom tooltip ───────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>KES {Number(p.value).toLocaleString()}</p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isVendor, isAdmin, loading: roleLoading } = useUserRole();

  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // Shoppers stay on /dashboard with upgrade CTA — NEVER redirect to /feed
  const isShopper = !roleLoading && !isVendor && !isAdmin;

  // ── Load user + stores ────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      let authUser = sessionData.session?.user ?? null;
      if (!authUser) {
        const { data: auth } = await supabase.auth.getUser();
        authUser = auth.user ?? null;
      }
      // Stay on dashboard route family: login with returnUrl, never /feed
      if (!authUser) {
        router.push("/login?returnUrl=/dashboard");
        return;
      }
      setUser({ id: authUser.id, email: authUser.email ?? "" });

      const { data: storesData } = await supabase
        .from("stores").select("*").eq("user_id", authUser.id);
      const allStores = storesData ?? [];
      setStores(allStores);
      setActiveStore(allStores[0] || null);
      setLoading(false);
    };
    load();
  }, [router]);

  // ── Load products + orders + revenue ────────────────────────
  useEffect(() => {
    if (!activeStore) return;
    const load = async () => {
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", activeStore.id)
        .order("created_at", { ascending: false });
      setProducts(prods ?? []);

      let rawOrders: any[] = [];
      try {
        const dashRes = await fetch("/api/vendor/dashboard");
        if (dashRes.ok) {
          const dash = await dashRes.json();
          rawOrders = dash.recentOrders ?? [];
        }
      } catch {
        rawOrders = [];
      }
      setOrders(rawOrders);

      // Build last-7-days revenue chart
      const days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days[d.toLocaleDateString("en-KE", { month: "short", day: "numeric" })] = 0;
      }
      rawOrders.forEach((o) => {
        if (o.status !== "paid") return;
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
        if (key in days) days[key] += Number(o.total ?? 0);
      });
      setRevenueData(Object.entries(days).map(([day, revenue]) => ({ day, revenue })));
    };
    load();
  }, [activeStore]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => (p.name || "").toLowerCase().includes(q)) : products;
  }, [products, query]);

  const totalRevenue = orders.filter((o) => o.status === "paid").reduce((acc, o) => acc + Number(o.total ?? 0), 0);
  const recentOrders = orders.slice(0, 5);

  const getImage = (p: any) => {
    if (!Array.isArray(p?.images) || !p.images[0]) return "/placeholder.png";
    const img = p.images[0];
    return typeof img === "string" ? img : "/placeholder.png";
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] text-white">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Shopper gate: limited view + vendor upgrade — stay on /dashboard (no /feed)
  if (isShopper) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white relative overflow-x-hidden">
        <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-600/8 blur-[160px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-16 space-y-8">
          <div className="space-y-3">
            <BrandLogo href="/feed" size="sm" />
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
          <div
            data-testid="dashboard-shopper-upgrade"
            className="rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 via-black to-fuchsia-950/30 p-8 space-y-5"
          >
            <h2 className="text-xl font-semibold text-white">Vendor features</h2>
            <p className="text-sm text-white/70 leading-relaxed">
              You&apos;re signed in as a shopper. Unlock the vendor dashboard for
              analytics, products, ads, live commerce, and payouts.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/create-store"
                className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-gray-100 transition"
              >
                Create a store
              </Link>
              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center justify-center px-5 py-3 rounded-2xl border border-white/15 text-sm font-medium text-white/80 hover:bg-white/5 transition"
              >
                View vendor plans
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOutAndRedirect(router)}
            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white relative overflow-x-hidden">
      {/* Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-600/8 blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/6 blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-3">
            <BrandLogo href="/feed" size="sm" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight">
                  {isAdmin ? "Admin · Vendor Dashboard" : "Vendor Dashboard"}
                </h1>
                <SubscriptionTierBadge />
              </div>
              <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="px-4 py-2 rounded-xl border border-violet-500/30 text-violet-200 hover:bg-violet-500/10 text-sm transition"
              >
                Admin console
              </Link>
            )}
            <button onClick={() => signOutAndRedirect(router)}
              className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm transition">
              Logout
            </button>
          </div>
        </div>

        <TrialBanner />

        {/* ── STORE SWITCHER ───────────────────────────────────── */}
        {stores.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stores.map((s) => (
              <button key={s.id} onClick={() => setActiveStore(s)}
                className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition font-medium ${
                  activeStore?.id === s.id
                    ? "bg-white text-black"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}>
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* ── VENDOR STACK NAV ─────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Vendor Stack</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Command Center", icon: "🎯", href: "/vendor", desc: "Overview & KPIs" },
              { label: "Finance", icon: "💰", href: "/vendor/finance", desc: "Revenue & payouts" },
              { label: "Products", icon: "📦", href: "/vendor/products", desc: "Inventory studio" },
              { label: "Intelligence", icon: "🧠", href: "/vendor/intelligence", desc: "AI growth signals" },
              { label: "Platform Plan", icon: "👑", href: "/dashboard/subscription", desc: "Starter · Pro · Elite" },
              { label: "Ads Manager", icon: "📣", href: "/dashboard/ads", desc: "Promote listings" },
            ].map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                className="flex flex-col gap-2 py-5 px-4 rounded-2xl bg-white/3 border border-white/8 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition"
              >
                <span className="text-2xl">{tile.icon}</span>
                <span className="text-sm font-semibold text-gray-200">{tile.label}</span>
                <span className="text-[11px] text-gray-500">{tile.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── ANALYTICS KPI CARDS ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Revenue",
              value: totalRevenue,
              prefix: "KES ",
              href: VENDOR_KPI_LINKS.revenue,
              color: "from-purple-500/20 to-purple-500/5",
              border: "border-purple-500/20",
              icon: (
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              label: "Total Orders",
              value: orders.length,
              prefix: "",
              href: VENDOR_KPI_LINKS.orders,
              color: "from-cyan-500/20 to-cyan-500/5",
              border: "border-cyan-500/20",
              icon: (
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
            },
            {
              label: "Products",
              value: products.length,
              prefix: "",
              href: VENDOR_KPI_LINKS.products,
              color: "from-pink-500/20 to-pink-500/5",
              border: "border-pink-500/20",
              icon: (
                <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ),
            },
            {
              label: "Paid Orders",
              value: orders.filter((o) => o.status === "paid").length,
              prefix: "",
              href: VENDOR_KPI_LINKS.orders,
              color: "from-green-500/20 to-green-500/5",
              border: "border-green-500/20",
              icon: (
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map((card) => (
            <Link key={card.label} href={card.href}
              className={`block bg-gradient-to-br ${card.color} border ${card.border} rounded-2xl p-5 space-y-3 hover:scale-[1.02] transition-transform`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 uppercase tracking-wider">{card.label}</span>
                {card.icon}
              </div>
              <p className="text-2xl font-bold">
                <AnimatedNumber value={card.value} prefix={card.prefix} />
              </p>
            </Link>
          ))}
        </div>

        {/* ── REVENUE CHART ────────────────────────────────────── */}
        {revenueData.length > 0 && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-200">Revenue — Last 7 Days</h2>
              <span className="text-xs text-gray-500">KES</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── QUICK ACTIONS ────────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Creator Studio",
                icon: "🎬",
                href: "/dashboard/creator-studio",
                color: "hover:border-pink-500/40 hover:bg-pink-500/5",
              },
              {
                label: "New Product",
                icon: "📦",
                href: "/dashboard/create-product",
                color: "hover:border-purple-500/40 hover:bg-purple-500/5",
              },
              {
                label: "New Post",
                icon: "✨",
                href: "/dashboard/create-post",
                color: "hover:border-purple-500/40 hover:bg-purple-500/5",
              },
              {
                label: "Calendar",
                icon: "📅",
                href: "/dashboard/calendar",
                color: "hover:border-cyan-500/40 hover:bg-cyan-500/5",
              },
              {
                label: "Promote",
                icon: "🚀",
                href: "/dashboard/promote",
                color: "hover:border-pink-500/40 hover:bg-pink-500/5",
              },
              {
                label: "Vendor Profile",
                icon: "🪪",
                href: "/dashboard/vendor/profile",
                color: "hover:border-purple-500/40 hover:bg-purple-500/5",
              },
              {
                label: "Finance",
                icon: "💰",
                href: "/dashboard/finance",
                color: "hover:border-cyan-500/40 hover:bg-cyan-500/5",
              },
              {
                label: "New Store",
                icon: "🏪",
                href: "/dashboard/create-store",
                color: "hover:border-pink-500/40 hover:bg-pink-500/5",
              },
              {
                label: "Categories",
                icon: "🏷️",
                href: "/dashboard/categories",
                color: "hover:border-green-500/40 hover:bg-green-500/5",
              },
            ].map((action) => (
              <button key={action.label}
                onClick={() => router.push(action.href)}
                className={`flex flex-col items-center gap-2 py-5 rounded-2xl bg-white/3 border border-white/8 transition ${action.color}`}>
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm font-medium text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── RECENT ORDERS ────────────────────────────────────── */}
        {recentOrders.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Recent Orders</h2>
            <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
              {recentOrders.map((o, i) => (
                <div key={o.id}
                  className={`flex items-center justify-between px-5 py-3.5 ${i < recentOrders.length - 1 ? "border-b border-white/5" : ""}`}>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium truncate max-w-[180px]">
                      {o.id.substring(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(o.created_at).toLocaleDateString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">KES {Number(o.total ?? 0).toLocaleString()}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      o.status === "paid" ? "bg-green-500/15 text-green-400"
                      : o.status === "failed" ? "bg-red-500/15 text-red-400"
                      : "bg-yellow-500/15 text-yellow-400"
                    }`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRODUCTS GRID ────────────────────────────────────── */}
        {activeStore && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Your Products</h2>
              {products.length > 0 && (
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 outline-none text-sm w-40 focus:w-56 transition-all"
                />
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">📦</p>
                <p>No products yet</p>
                <button onClick={() => router.push("/dashboard/create-product")}
                  className="mt-4 px-5 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-gray-100 transition">
                  Add your first product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {filtered.map((p) => (
                  <div key={p.id}
                    onClick={() => router.push(`/dashboard/product/${p.id}`)}
                    className="cursor-pointer group relative rounded-2xl overflow-hidden border border-white/8 bg-white/3 hover:border-white/20 hover:scale-[1.02] transition duration-200">
                    <div className="relative overflow-hidden">
                      <ProductImage
                        src={getImage(p)}
                        className="w-full h-48 object-cover group-hover:scale-110 transition duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {(p.stock ?? 0) <= 0 && (
                        <div className="absolute top-2 right-2 bg-red-500/80 text-white text-xs px-2 py-0.5 rounded-full">
                          Out of stock
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <h4 className="font-medium text-sm truncate">{p.name}</h4>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">KES {Number(p.price).toLocaleString()}</span>
                        <span className="text-xs text-gray-500">{p.stock ?? 0} left</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
