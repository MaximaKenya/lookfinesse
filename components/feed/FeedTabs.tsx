"use client";

import type { FeedCategory } from "@/lib/types/social";
import ScrollableFilterBar from "@/components/ui/ScrollableFilterBar";

const TABS: { id: FeedCategory; label: string; emoji: string }[] = [
  { id: "discover", label: "Discover", emoji: "✦" },
  { id: "following", label: "Following", emoji: "👥" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
  { id: "beauty", label: "Beauty", emoji: "💅" },
  { id: "style", label: "Style", emoji: "👗" },
  { id: "nearby", label: "Nearby", emoji: "📍" },
  { id: "live", label: "Live", emoji: "🔴" },
];

type Props = {
  active: FeedCategory;
  onChange: (tab: FeedCategory) => void;
};

export default function FeedTabs({ active, onChange }: Props) {
  return (
    <ScrollableFilterBar>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap snap-start shrink-0 transition-all ${
            active === tab.id
              ? "bg-white text-black shadow-lg shadow-white/10"
              : "bg-white/5 text-white/50 border border-white/8 hover:text-white hover:bg-white/10"
          }`}
        >
          <span className="text-[11px]">{tab.emoji}</span>
          {tab.label}
        </button>
      ))}
    </ScrollableFilterBar>
  );
}
