"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Show desktop arrow controls (hidden on touch-primary viewports via CSS). */
  showArrows?: boolean;
};

export default function ScrollableFilterBar({
  children,
  className = "",
  showArrows = true,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
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
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: "smooth" });
  };

  return (
    <div className={`relative flex items-center gap-1 min-w-0 ${className}`}>
      {showArrows && (
        <button
          type="button"
          aria-label="Scroll filters left"
          onClick={() => scrollBy(-1)}
          disabled={!canLeft}
          className="hidden md:flex shrink-0 w-8 h-8 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex-1 min-w-0 flex gap-2 overflow-x-auto pb-1 scroll-smooth snap-x snap-proximity scrollbar-hide touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>

      {showArrows && (
        <button
          type="button"
          aria-label="Scroll filters right"
          onClick={() => scrollBy(1)}
          disabled={!canRight}
          className="hidden md:flex shrink-0 w-8 h-8 items-center justify-center rounded-full border border-white/10 bg-black/80 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
