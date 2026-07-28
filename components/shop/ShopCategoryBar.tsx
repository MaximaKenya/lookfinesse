"use client";

import ScrollableFilterBar from "@/components/ui/ScrollableFilterBar";
import { TOP_SHOP_CATEGORIES } from "@/lib/categories/canonical";

type Props = {
  category: string;
  onChange: (value: string) => void;
};

export default function ShopCategoryBar({ category, onChange }: Props) {
  return (
    <ScrollableFilterBar>
      {TOP_SHOP_CATEGORIES.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start shrink-0 transition-all ${
            category === c.value
              ? "bg-white text-black"
              : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10"
          }`}
        >
          {c.label}
        </button>
      ))}
    </ScrollableFilterBar>
  );
}
