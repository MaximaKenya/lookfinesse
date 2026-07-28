"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import BrandLogo from "@/components/brand/BrandLogo";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="w-full sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <BrandLogo href="/feed" size="sm" />

        <nav className="flex items-center gap-1">
          <Link
            href="/shop"
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              pathname?.startsWith("/shop")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Shop
          </Link>
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              pathname?.startsWith("/dashboard")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
