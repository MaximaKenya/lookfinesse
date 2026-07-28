"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CreditCard,
  LineChart,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Truck,
  Wallet,
  ShieldCheck,
} from "lucide-react";

import RealtimeRevenueChart from "@/components/realtime/RealtimeRevenueChart";
import TransactionTimeline from "@/components/orders/TransactionTimeline";
import SubscriptionTierBadge from "@/components/vendor/SubscriptionTierBadge";
import { VENDOR_KPI_LINKS } from "@/lib/nav/dashboards";

interface VendorDashboardData {
  metrics: {
    totalRevenue: number;
    monthlyRevenue: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    lowStockProducts: number;
    walletBalance: number;
    conversionRate: number;
  };
  revenue?: any;
  recentOrders: any[];
  topProducts: any[];
  operationalAlerts: {
    type: string;
    message: string;
    severity: string;
  }[];
}

function MetricCard({
  title,
  value,
  change,
  icon,
  href,
  glow,
}: {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  href: string;
  glow: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:border-white/15 hover:bg-white/[0.06] shadow-2xl ${glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-zinc-500 text-sm font-medium">{title}</div>
          <div className="text-4xl font-bold text-white mt-4 tracking-tight">
            {value}
          </div>
          <div className="text-green-400 text-sm mt-3 flex items-center gap-1.5">
            {change}
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-white transition" />
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
    </Link>
  );
}

function QuickTile({
  href,
  label,
  description,
  icon: Icon,
  accent,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-5 hover:bg-white/[0.07] hover:border-white/15 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/40 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition" />
      </div>
      <div className="mt-5">
        <div className="text-base font-semibold text-white">{label}</div>
        <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}

export default function VendorDashboardPage() {
  const [data, setData] = useState<VendorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);
      const res = await fetch("/api/vendor/dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    const interval = setInterval(() => {
      void loadDashboard();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const metrics = data?.metrics;

  const orderTimeline = useMemo(() => {
    return (
      data?.recentOrders?.map((order: any) => ({
        id: order.id,
        type: order.status,
        amount: order.total_amount,
        created_at: order.created_at,
        description: `${order.customer_name || "Customer"} placed order`,
      })) || []
    );
  }, [data]);

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/8 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 p-8">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500 blur-3xl rounded-full" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-500 blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-sm font-medium mb-6">
                <Activity size={16} />
                LIVE VENDOR INFRASTRUCTURE
              </div>
              <SubscriptionTierBadge className="mb-4" />

              <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-none">
                Vendor
                <span className="text-cyan-400"> Command Center</span>
              </h1>

              <p className="text-zinc-400 text-lg mt-6 leading-relaxed max-w-2xl">
                Manage products, inventory, orders, payouts, fulfillment,
                operational intelligence and revenue growth from a single
                realtime commerce operating system.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-8">
                <Link
                  href="/vendor/products"
                  className="bg-cyan-500 hover:bg-cyan-400 transition-all px-6 py-4 rounded-2xl text-black font-bold flex items-center gap-3"
                >
                  Open Product Studio
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/vendor/finance"
                  className="border border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20 transition-all px-6 py-4 rounded-2xl font-semibold flex items-center gap-3"
                >
                  Financial Center
                  <ArrowUpRight size={16} />
                </Link>
                <Link
                  href="/vendor/orders"
                  className="border border-white/10 bg-white/5 hover:bg-white/10 transition-all px-6 py-4 rounded-2xl text-white font-semibold"
                >
                  View Orders
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[320px]">
              <Link
                href={VENDOR_KPI_LINKS.payouts}
                className="group rounded-3xl bg-black/50 border border-white/10 p-5 hover:bg-black/70 transition"
              >
                <div className="text-zinc-500 text-sm flex items-center justify-between">
                  Wallet Balance
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-white" />
                </div>
                <div className="text-3xl font-bold text-green-400 mt-3">
                  KES {Number(metrics?.walletBalance || 0).toLocaleString()}
                </div>
              </Link>

              <Link
                href="/vendor/intelligence"
                className="group rounded-3xl bg-black/50 border border-white/10 p-5 hover:bg-black/70 transition"
              >
                <div className="text-zinc-500 text-sm flex items-center justify-between">
                  Conversion Rate
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-white" />
                </div>
                <div className="text-3xl font-bold text-cyan-400 mt-3">
                  {metrics?.conversionRate || 0}%
                </div>
              </Link>

              <Link
                href="/vendor/orders"
                className="group rounded-3xl bg-black/50 border border-white/10 p-5 hover:bg-black/70 transition"
              >
                <div className="text-zinc-500 text-sm flex items-center justify-between">
                  Pending Orders
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-white" />
                </div>
                <div className="text-3xl font-bold text-yellow-400 mt-3">
                  {metrics?.pendingOrders || 0}
                </div>
              </Link>

              <Link
                href="/vendor/products"
                className="group rounded-3xl bg-black/50 border border-white/10 p-5 hover:bg-black/70 transition"
              >
                <div className="text-zinc-500 text-sm flex items-center justify-between">
                  Active Products
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-white" />
                </div>
                <div className="text-3xl font-bold text-white mt-3">
                  {metrics?.activeProducts || 0}
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* QUICK ACCESS */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/30">
                Quick Access
              </div>
              <h2 className="text-2xl font-bold mt-1">Jump into your stack</h2>
            </div>
            {loading && (
              <span className="text-xs text-cyan-300 animate-pulse">syncing…</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <QuickTile
              href="/vendor/finance"
              label="Finance Center"
              description="Wallets, FX, payouts, KYC"
              icon={Wallet}
              accent="text-green-300"
            />
            <QuickTile
              href="/vendor/products"
              label="Product Studio"
              description="Listings & inventory"
              icon={ShoppingBag}
              accent="text-purple-300"
            />
            <QuickTile
              href="/vendor/orders"
              label="Orders"
              description="Fulfillment queue"
              icon={Truck}
              accent="text-amber-300"
            />
            <QuickTile
              href="/vendor/intelligence"
              label="Vendor Intel"
              description="AI growth signals"
              icon={BrainCircuit}
              accent="text-fuchsia-300"
            />
            <QuickTile
              href="/dashboard/finance"
              label="Live Ledger"
              description="Realtime balance"
              icon={LineChart}
              accent="text-emerald-300"
            />
            <QuickTile
              href="/dashboard/subscription"
              label="Platform Plan"
              description="Starter, Pro & Elite"
              icon={Sparkles}
              accent="text-amber-300"
            />
            <QuickTile
              href="/dashboard/vendor/kyc"
              label="KYC"
              description="Verify identity"
              icon={ShieldCheck}
              accent="text-cyan-300"
            />
          </div>
        </section>

        {/* KPI GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={`KES ${Number(metrics?.totalRevenue || 0).toLocaleString()}`}
            change="Realtime marketplace revenue"
            icon={<Wallet size={24} />}
            href={VENDOR_KPI_LINKS.revenue}
            glow="shadow-green-500/10"
          />
          <MetricCard
            title="Monthly Revenue"
            value={`KES ${Number(metrics?.monthlyRevenue || 0).toLocaleString()}`}
            change="Current month performance"
            icon={<TrendingUp size={24} />}
            href={VENDOR_KPI_LINKS.revenue}
            glow="shadow-cyan-500/10"
          />
          <MetricCard
            title="Orders"
            value={metrics?.totalOrders || 0}
            change="Marketplace order volume"
            icon={<ShoppingCart size={24} />}
            href={VENDOR_KPI_LINKS.orders}
            glow="shadow-purple-500/10"
          />
          <MetricCard
            title="Low Stock"
            value={metrics?.lowStockProducts || 0}
            change="Restock alerts"
            icon={<AlertTriangle size={24} />}
            href={VENDOR_KPI_LINKS.lowStock}
            glow="shadow-red-500/10"
          />
        </section>

        {/* REVENUE + PRODUCTS */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RealtimeRevenueChart data={data} />
          </div>

          <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Top Products</h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Best performing inventory
                </p>
              </div>
              <Link
                href="/vendor/products"
                className="text-cyan-300 text-xs font-semibold inline-flex items-center gap-1 hover:underline"
              >
                Manage
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {(data?.topProducts ?? []).length === 0 && (
                <Link
                  href="/dashboard/create-product"
                  className="block rounded-2xl border border-dashed border-white/15 bg-black/30 p-6 text-center text-sm text-zinc-400 hover:bg-white/5"
                >
                  No top products yet — launch your first listing →
                </Link>
              )}
              {data?.topProducts?.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/dashboard/product/${product.id}`}
                  className="group block rounded-2xl border border-white/8 bg-black/40 p-4 hover:bg-white/5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">
                        {product.name}
                      </div>
                      <div className="text-zinc-500 text-sm mt-1">
                        {product.orders_count || 0} orders
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        KES {Number(product.revenue || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 inline-flex items-center gap-1">
                        Revenue
                        <ArrowUpRight className="h-3 w-3 text-zinc-600 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* OPS */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Operational Alerts</h2>
                <p className="text-zinc-500 text-sm mt-1">
                  AI marketplace intelligence
                </p>
              </div>
              <Link
                href="/vendor/intelligence"
                className="text-yellow-300 text-xs font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <Sparkles className="h-3 w-3" />
                Open Intelligence
              </Link>
            </div>

            <div className="space-y-3">
              {(data?.operationalAlerts ?? []).length === 0 && (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-300">
                  All systems nominal — no active alerts.
                </div>
              )}
              {data?.operationalAlerts?.map((alert, index) => {
                const href =
                  alert.type === "inventory"
                    ? "/vendor/products"
                    : alert.type === "fraud"
                    ? "/vendor/intelligence"
                    : "/vendor/orders";
                return (
                  <Link
                    key={index}
                    href={href}
                    className={`group block rounded-2xl border p-4 transition ${
                      alert.severity === "critical"
                        ? "bg-red-500/10 border-red-500/20 hover:bg-red-500/15"
                        : "bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/15"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold capitalize">{alert.type}</div>
                      <div
                        className={`text-xs uppercase font-bold inline-flex items-center gap-1 ${
                          alert.severity === "critical"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {alert.severity}
                        <ArrowUpRight className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                      </div>
                    </div>
                    <div className="text-zinc-300 text-sm mt-3">{alert.message}</div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Transaction Timeline</h2>
                <p className="text-zinc-500 text-sm mt-1">
                  Realtime order intelligence
                </p>
              </div>
              <Link
                href="/vendor/finance"
                className="text-green-300 text-xs font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <CreditCard className="h-3 w-3" />
                Finance
              </Link>
            </div>

            {orderTimeline.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-8 text-center text-sm text-zinc-500">
                Transactions will appear here as orders flow in.
              </div>
            ) : (
              <TransactionTimeline orderId={data?.recentOrders?.[0]?.id ?? "demo-order"} />
            )}
            <div className="mt-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">
                Showing latest activity across all stores.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
