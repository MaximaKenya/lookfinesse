"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

function paginationWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (page >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", page - 1, page, page + 1, "…", total];
}

export default function Pagination({ page, totalPages, onChange, className = "" }: Props) {
  if (totalPages <= 1) return null;
  const items = paginationWindow(page, totalPages);

  return (
    <nav className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {items.map((it, i) =>
        it === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-white/30 text-sm">…</span>
        ) : (
          <button
            key={it}
            onClick={() => onChange(it as number)}
            className={`min-w-9 h-9 px-3 rounded-xl text-sm font-semibold transition-all ${
              it === page
                ? "bg-white text-black"
                : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            {it}
          </button>
        )
      )}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

/** Helper that slices an array into a single page of results. */
export function getPageSlice<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return { totalPages, slice, safePage };
}

/** Backwards-compat re-export so call sites using `usePageSlice` still work. */
export const usePageSlice = getPageSlice;
