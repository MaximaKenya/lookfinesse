"use client";

import { useState, useCallback } from "react";
import ProductImage from "./ProductImage";

export default function ProductGallery({ images }: { images: string[] }) {
  const validImages =
    images?.filter((img) => typeof img === "string" && img.startsWith("http")) || [];

  const [activeIdx, setActiveIdx] = useState(0);
  const [fading, setFading] = useState(false);

  const active = validImages[activeIdx] || "/placeholder.png";

  const switchTo = useCallback(
    (idx: number) => {
      if (idx === activeIdx) return;
      setFading(true);
      setTimeout(() => {
        setActiveIdx(idx);
        setFading(false);
      }, 160);
    },
    [activeIdx]
  );

  const prev = () => switchTo((activeIdx - 1 + Math.max(validImages.length, 1)) % Math.max(validImages.length, 1));
  const next = () => switchTo((activeIdx + 1) % Math.max(validImages.length, 1));

  return (
    <div className="space-y-4">
      {/* MAIN IMAGE */}
      <div className="relative w-full aspect-square bg-white/4 border border-white/10 rounded-3xl overflow-hidden group">
        <div
          className={`w-full h-full transition-opacity duration-160 ${fading ? "opacity-0" : "opacity-100"}`}
        >
          <ProductImage
            src={active}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Prev/Next arrows — visible on multi-image */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dot indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {validImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => switchTo(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === activeIdx
                      ? "w-5 h-1.5 bg-white"
                      : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Image count badge */}
        {validImages.length > 1 && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-xs text-gray-300">
            {activeIdx + 1} / {validImages.length}
          </div>
        )}
      </div>

      {/* THUMBNAILS */}
      {validImages.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
          {validImages.map((img, i) => (
            <button
              key={i}
              onClick={() => switchTo(i)}
              className={`flex-none w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                i === activeIdx
                  ? "border-white scale-105 shadow-lg shadow-white/10"
                  : "border-white/15 hover:border-white/40 opacity-70 hover:opacity-100"
              }`}
            >
              <ProductImage src={img} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
