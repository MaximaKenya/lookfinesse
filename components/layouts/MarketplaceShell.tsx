"use client";

import BrandLogo from "@/components/brand/BrandLogo";

export default function MarketplaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">

        <aside className="w-72 border-r border-zinc-800 bg-zinc-950 min-h-screen p-6">
          <BrandLogo href="/feed" size="md" />

          <div className="mt-10 space-y-3">
            <div className="text-zinc-400">Dashboard</div>
            <div className="text-zinc-400">Products</div>
            <div className="text-zinc-400">Orders</div>
            <div className="text-zinc-400">Treasury</div>
            <div className="text-zinc-400">Intelligence</div>
          </div>
        </aside>

        <main className="flex-1 p-8">
          {children}
        </main>

      </div>
    </div>
  );
}
