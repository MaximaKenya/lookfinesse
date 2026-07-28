"use client";

import ScrollableFilterBar from "@/components/ui/ScrollableFilterBar";

const TYPES = ["all", "gym", "salon", "stylist", "wellness", "beauty"];

type Props = {
  filter: string;
  onChange: (value: string) => void;
};

export default function NearbyTypeFilter({ filter, onChange }: Props) {
  return (
    <ScrollableFilterBar>
      {TYPES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap snap-start shrink-0 capitalize transition-all ${
            filter === t ? "bg-white text-black" : "bg-white/5 text-white/50 border border-white/8 hover:text-white"
          }`}
        >
          {t}
        </button>
      ))}
    </ScrollableFilterBar>
  );
}
