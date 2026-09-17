"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

type Props = {
  className?: string;
  /** Compact icon-only control for tight headers */
  compact?: boolean;
};

export default function CartButton({ className = "", compact = false }: Props) {
  const { cart, setOpen } = useCart();
  const count = cart.reduce(
    (sum: number, item: { quantity?: number }) => sum + (item.quantity || 1),
    0
  );

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count > 0 ? `Open cart, ${count} items` : "Open cart"}
      className={
        className ||
        (compact
          ? "relative p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition"
          : "relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all")
      }
    >
      <ShoppingBag className={compact ? "w-5 h-5" : "w-4 h-4"} />
      {!compact && <span>Cart</span>}
      {count > 0 && (
        <span
          className={
            compact
              ? "absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-purple-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-black"
              : "ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-purple-500 text-[11px] font-bold text-white flex items-center justify-center"
          }
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
