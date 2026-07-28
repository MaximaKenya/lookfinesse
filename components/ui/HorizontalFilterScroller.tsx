"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export default function HorizontalFilterScroller({
  children,
  className = "",
  ariaLabel = "Filters",
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows, children]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(160, Math.floor(el.clientWidth * 0.65));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className={`relative group ${className}`}>
      {canLeft && (
        <button
          type="button"
          aria-label="Scroll filters left"
          onClick={() => scrollBy(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/80 text-white/80 shadow-lg backdrop-blur hover:bg-black hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <motion.div
        ref={scrollerRef}
        role="region"
        aria-label={ariaLabel}
        className="flex gap-2 overflow-x-auto pb-1 scroll-smooth scrollbar-hide -mx-1 px-1 snap-x snap-mandatory touch-pan-x"
        initial={false}
      >
        {children}
      </motion.div>

      {canRight && (
        <button
          type="button"
          aria-label="Scroll filters right"
          onClick={() => scrollBy(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/80 text-white/80 shadow-lg backdrop-blur hover:bg-black hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Mobile edge fades */}
      {canLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-1 w-6 bg-gradient-to-r from-black to-transparent sm:hidden" />
      )}
      {canRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-black to-transparent sm:hidden" />
      )}
    </div>
  );
}
