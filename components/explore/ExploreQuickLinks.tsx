"use client";

import Link from "next/link";
import ScrollableFilterBar from "@/components/ui/ScrollableFilterBar";

const QUICK_LINKS = [
  { href: "/feed", label: "Feed", emoji: "🏠" },
  { href: "/reels", label: "Reels", emoji: "🎬" },
  { href: "/services", label: "Services", emoji: "📅" },
  { href: "/live", label: "Live", emoji: "🔴" },
  { href: "/shop", label: "Shop", emoji: "🛍️" },
  { href: "/challenges", label: "Challenges", emoji: "🏆" },
];

export default function ExploreQuickLinks() {
  return (
    <ScrollableFilterBar>
      {QUICK_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/8 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap snap-start shrink-0"
        >
          <span>{l.emoji}</span>
          {l.label}
        </Link>
      ))}
    </ScrollableFilterBar>
  );
}
