"use client";

import Link from "next/link";

import {
  Activity,
  BarChart3,
  BrainCircuit,
  LayoutDashboard,
  Package2,
  Shield,
  Wallet,
} from "lucide-react";

import BrandLogo from "@/components/brand/BrandLogo";

export default function MarketplaceShell({
  children,
}: {
  children: React.ReactNode;
}) {

  const navigation = [
    {
      label: "Mission Control",
      href: "/admin",
      icon: <LayoutDashboard size={18} />,
    },

    {
      label: "Finance",
      href: "/admin/finance",
      icon: <Wallet size={18} />,
    },

    {
      label: "Intelligence",
      href: "/admin/intelligence",
      icon: <BrainCircuit size={18} />,
    },

    {
      label: "Live Ops",
      href: "/admin/live",
      icon: <Activity size={18} />,
    },

    {
      label: "Vendor",
      href: "/vendor",
      icon: <Package2 size={18} />,
    },

    {
      label: "Analytics",
      href: "/analytics",
      icon: <BarChart3 size={18} />,
    },

    {
      label: "Security",
      href: "/security",
      icon: <Shield size={18} />,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* SIDEBAR */}
      <aside className="hidden xl:flex w-72 bg-zinc-950 border-r border-zinc-800 flex-col">

        {/* BRAND */}
        <div className="px-6 py-8 border-b border-zinc-800">
          <BrandLogo href="/feed" size="md" />
          <p className="mt-3 text-xs text-zinc-500">Enterprise Commerce Infrastructure</p>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 p-4 space-y-2">

          {navigation.map((item) => (

            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-800"
            >

              <div className="text-zinc-500">
                {item.icon}
              </div>

              <div className="font-medium">
                {item.label}
              </div>

            </Link>

          ))}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-zinc-800 space-y-3">
          <BrandLogo href="/feed" variant="icon" size="sm" className="opacity-80" />

          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">

            <div className="flex items-center gap-2 mb-2">

              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

              <div className="text-green-400 text-sm font-semibold">
                SYSTEM ONLINE
              </div>

            </div>

            <div className="text-zinc-500 text-xs leading-relaxed">
              Unified treasury, intelligence,
              fraud defense, and commerce infrastructure.
            </div>

          </div>

        </div>

      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0">

        {/* TOPBAR */}
        <header className="h-20 border-b border-zinc-800 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6">

          <div>
            <div className="text-sm text-zinc-500">
              Marketplace Infrastructure
            </div>

            <div className="font-semibold text-white">
              Unified Commerce Operating System
            </div>
          </div>

          <div className="flex items-center gap-3">

            <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">

              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

              <span className="text-sm text-zinc-300">
                All Systems Operational
              </span>

            </div>

            <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold">
              A
            </div>

          </div>

        </header>

        {/* PAGE */}
        <div className="p-6">
          {children}
        </div>

      </div>

    </div>
  );
}