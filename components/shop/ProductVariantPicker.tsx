"use client";

import { useState } from "react";

type Variant = { id: string; label: string; sublabel?: string };

const DEFAULT_VARIANTS: Variant[] = [
  { id: "s", label: "S" },
  { id: "m", label: "M" },
  { id: "l", label: "L" },
  { id: "xl", label: "XL" },
];

type Props = {
  category?: string | null;
};

export default function ProductVariantPicker({ category }: Props) {
  const isDenim = category === "jeans" || category === "fashion" || category === "activewear";
  const variants = isDenim ? DEFAULT_VARIANTS : [{ id: "one", label: "One size" }];
  const [selected, setSelected] = useState(variants[0]?.id ?? "one");

  return (
    <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          {isDenim ? "Size" : "Variant"}
        </p>
        <span className="text-xs text-white/30">{isDenim ? "Size guide" : "In stock"}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSelected(v.id)}
            className={`min-w-[3rem] rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
              selected === v.id
                ? "border-white bg-white text-black"
                : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:text-white"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
