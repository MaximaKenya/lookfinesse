"use client";



import Link from "next/link";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";

import {

  Activity,

  ArrowUpRight,

  BrainCircuit,

  LayoutDashboard,

  Wallet,

} from "lucide-react";

import { ADMIN_KPI_LINKS } from "@/lib/nav/dashboards";



const EXEC_TILES = [

  {

    href: "/admin",

    label: "Mission Control",

    description: "Executive overview & KPIs",

    icon: LayoutDashboard,

    accent: "text-white",

  },

  {

    href: "/admin/live",

    label: "Live Ops",

    description: "Realtime streams & payment rails",

    icon: Activity,

    accent: "text-purple-300",

  },

  {

    href: "/finance",

    label: "Financial Control",

    description: "Treasury, escrow, settlements",

    icon: Wallet,

    accent: "text-green-300",

  },

  {

    href: "/intelligence",

    label: "AI Intelligence",

    description: "Predictive risk & treasury signals",

    icon: BrainCircuit,

    accent: "text-fuchsia-300",

  },

];



export default function AdminFinanceDashboard() {

  const [stats, setStats] = useState<{

    revenue: number;

    payouts: number;

    pendingPayouts: any[];

    fraud: any[];

  }>({

    revenue: 0,

    payouts: 0,

    pendingPayouts: [],

    fraud: [],

  });



  useEffect(() => {

    const load = async () => {

      const { data: revenueData } = await supabase

        .from("ledger_entries")

        .select("amount")

        .eq("category", "fee");



      const revenue =

        revenueData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;



      const { data: payouts } = await supabase.from("payouts").select("*");



      const totalPayouts =

        payouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;



      const pending = payouts?.filter((p) => p.status === "pending") || [];



      const { data: fraud } = await supabase

        .from("fraud_logs")

        .select("*")

        .order("created_at", { ascending: false });



      setStats({

        revenue,

        payouts: totalPayouts,

        pendingPayouts: pending,

        fraud: fraud || [],

      });

    };



    load();

  }, []);



  return (

    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-8">

      <div className="mx-auto max-w-7xl space-y-8">

        <header className="relative overflow-hidden rounded-[32px] border border-white/8 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8">

          <div className="absolute top-0 right-0 w-72 h-72 bg-green-500/10 blur-3xl rounded-full" />

          <div className="relative z-10">

            <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-2">Admin Infrastructure</p>

            <h1 className="text-4xl font-black tracking-tight">Executive Console</h1>

            <p className="text-zinc-400 mt-3 max-w-2xl">

              Jump into mission control, live ops, treasury finance, and marketplace intelligence.

            </p>

          </div>

        </header>



        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {EXEC_TILES.map(({ href, label, description, icon: Icon, accent }) => (

            <Link

              key={href}

              href={href}

              className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl hover:border-white/15 hover:bg-white/[0.06] transition-all"

            >

              <div className="flex items-center justify-between">

                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/40 ${accent}`}>

                  <Icon className="h-5 w-5" />

                </div>

                <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition" />

              </div>

              <div className="mt-4">

                <div className="text-base font-semibold text-white">{label}</div>

                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{description}</p>

              </div>

            </Link>

          ))}

        </section>



        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Link href={ADMIN_KPI_LINKS.treasury} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition">

            <p className="text-gray-400 text-sm">Total Revenue</p>

            <h2 className="text-3xl font-bold mt-2">KES {stats.revenue.toLocaleString()}</h2>

          </Link>

          <Link href={ADMIN_KPI_LINKS.payouts} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6 hover:bg-white/[0.06] transition">

            <p className="text-gray-400 text-sm">Total Payouts</p>

            <h2 className="text-2xl font-bold mt-2">KES {stats.payouts.toLocaleString()}</h2>

          </Link>

        </section>



        <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">

          <div className="flex items-center justify-between mb-4">

            <h2 className="font-semibold">Pending Payouts</h2>

            <Link href={ADMIN_KPI_LINKS.payouts} className="text-xs text-cyan-300 inline-flex items-center gap-1 hover:underline">

              Open queue <ArrowUpRight className="h-3 w-3" />

            </Link>

          </div>

          {stats.pendingPayouts.length === 0 ? (

            <p className="text-sm text-zinc-500">No pending payouts.</p>

          ) : (

            stats.pendingPayouts.map((p) => (

              <div key={p.id} className="flex justify-between py-2 border-b border-white/5 last:border-0">

                <span>KES {p.amount}</span>

                <span className="text-yellow-400">{p.status}</span>

              </div>

            ))

          )}

        </section>



        <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">

          <div className="flex items-center justify-between mb-4">

            <h2 className="font-semibold text-red-400">Fraud Alerts</h2>

            <Link href={ADMIN_KPI_LINKS.fraud} className="text-xs text-red-300 inline-flex items-center gap-1 hover:underline">

              Risk radar <ArrowUpRight className="h-3 w-3" />

            </Link>

          </div>

          {stats.fraud.length === 0 ? (

            <p className="text-sm text-zinc-500">No fraud alerts.</p>

          ) : (

            stats.fraud.map((f) => (

              <div key={f.id} className="text-sm border-b border-red-500/10 py-2 last:border-0">

                {f.reason}

              </div>

            ))

          )}

        </section>

      </div>

    </main>

  );

}

