"use client";

import Link from "next/link";
import ScrollableFilterBar from "@/components/ui/ScrollableFilterBar";

const CATEGORIES = [
  { id: "all", label: "All", emoji: "✦" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
  { id: "beauty", label: "Beauty", emoji: "💅" },
  { id: "salon", label: "Salon", emoji: "✂️" },
  { id: "wellness", label: "Wellness", emoji: "🧘" },
  { id: "training", label: "Training", emoji: "🏋️" },
];

export default function ServicesCategoryFilter({
  activeCategory,
}: {
  activeCategory: string;
}) {
  return (
    <ScrollableFilterBar>
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.id}
          href={cat.id === "all" ? "/services" : `/services?category=${cat.id}`}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start shrink-0 transition-all ${
            activeCategory === cat.id
              ? "bg-white text-black"
              : "bg-white/5 text-white/50 border border-white/8 hover:text-white hover:bg-white/10"
          }`}
        >
          <span>{cat.emoji}</span>
          {cat.label}
        </Link>
      ))}
    </ScrollableFilterBar>
  );
}
