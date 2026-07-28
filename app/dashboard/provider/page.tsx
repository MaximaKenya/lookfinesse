"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Calendar,
  Crown,
  Package,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type ProviderStats = {
  activeSubscribers: number;
  monthlyRevenue: number;
  upcomingSessions: number;
  plans: number;
};

export default function ProviderHubPage() {
  const { userId } = useCurrentUser();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [stats, setStats] = useState<ProviderStats>({
    activeSubscribers: 0,
    monthlyRevenue: 0,
    upcomingSessions: 0,
    plans: 0,
  });
  const [subs, setSubs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/vendor/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d?.vendorId) setVendorId(d.vendorId);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!vendorId) return;
    Promise.all([
      fetch(`/api/subscriptions?as_vendor=1&vendor_id=${vendorId}`).then((r) => r.json()),
      fetch(`/api/class-sessions?vendor_id=${vendorId}&upcoming=1`).then((r) => r.json()),
      fetch(`/api/service-plans?vendor_id=${vendorId}`).then((r) => r.json()),
    ]).then(([s, sess, plans]) => {
      const subList = Array.isArray(s) ? s : [];
      const sessList = Array.isArray(sess) ? sess : [];
      const planList = Array.isArray(plans) ? plans : [];
      setSubs(subList);
      setSessions(sessList);
      const active = subList.filter((x: { status: string }) => x.status === "active");
      const rev = active.reduce(
        (sum: number, x: { service_plans?: { price_kes?: number } }) =>
          sum + Number(x.service_plans?.price_kes ?? 0),
        0
      );
      setStats({
        activeSubscribers: active.length,
        monthlyRevenue: rev,
        upcomingSessions: sessList.length,
        plans: planList.length,
      });
    });
  }, [vendorId]);

  const kpis = [
    { label: "Active subscribers", value: stats.activeSubscribers, icon: Users, href: "/vendor/customers" },
    { label: "Sub revenue / mo", value: `KES ${stats.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, href: "/vendor/finance" },
    { label: "Upcoming sessions", value: stats.upcomingSessions, icon: Calendar, href: "/dashboard/sessions" },
    { label: "Active plans", value: stats.plans, icon: Crown, href: "/dashboard/provider" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/40 via-black/60 to-cyan-950/30 p-8 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.12),transparent_50%)]" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-widest text-purple-300/80 font-semibold">Provider Hub</p>
          <h1 className="text-3xl font-bold text-white mt-1">Memberships & Sessions</h1>
          <p className="text-white/40 text-sm mt-2 max-w-xl">
            Manage monthly plans, subscribers, live classes, and inventory from one dark-glass cockpit.
          </p>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5 hover:border-white/15 transition-all group"
          >
            <k.icon className="w-5 h-5 text-cyan-300 mb-3" />
            <p className="text-[10px] uppercase tracking-wider text-white/30">{k.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{k.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-white/8 bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-300" /> Recent subscribers
            </h2>
            <Link href="/vendor/customers" className="text-xs text-cyan-400 hover:underline">
              View all
            </Link>
          </div>
          {subs.length === 0 ? (
            <p className="text-sm text-white/30 py-8 text-center">No subscribers yet</p>
          ) : (
            <ul className="space-y-2">
              {subs.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3 text-sm"
                >
                  <span className="text-white/70 truncate">{s.service_plans?.name ?? "Plan"}</span>
                  <span className={`text-xs capitalize font-semibold ${s.status === "active" ? "text-green-400" : "text-amber-400"}`}>
                    {s.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-white/8 bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-300" /> Upcoming sessions
            </h2>
            <Link href="/dashboard/sessions" className="text-xs text-cyan-400 hover:underline">
              Schedule
            </Link>
          </div>
          {sessions.length === 0 ? (
            <p className="text-sm text-white/30 py-8 text-center">No sessions scheduled</p>
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="rounded-2xl border border-white/5 bg-black/30 px-4 py-3 text-sm space-y-1"
                >
                  <p className="font-medium text-white truncate">{s.title}</p>
                  <p className="text-xs text-white/40">
                    {new Date(s.starts_at).toLocaleString("en-KE", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {s.is_online && " · Online"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/vendor/products"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
        >
          <Package className="w-4 h-4" /> Inventory & products
        </Link>
        <Link
          href="/dashboard/sessions"
          className="inline-flex items-center gap-2 rounded-2xl bg-white text-black px-5 py-3 text-sm font-semibold hover:opacity-90"
        >
          <Calendar className="w-4 h-4" /> Schedule class
        </Link>
      </div>
    </div>
  );
}
