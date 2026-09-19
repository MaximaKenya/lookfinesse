"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { isVendorOpsPath, useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";

function formatKes(n: number) {
  return `KES ${Number(n || 0).toLocaleString()}`;
}

export default function CartDrawer() {
  const pathname = usePathname() ?? "";
  const { cart, open, setOpen, remove, increase, decrease } = useCart();
  const itemCount = cart.reduce(
    (sum: number, p: { quantity?: number }) => sum + (p.quantity || 1),
    0
  );
  const total = cart.reduce(
    (sum: number, p: { price: number; quantity?: number }) =>
      sum + p.price * (p.quantity || 1),
    0
  );

  // Closed (or ops) carts must not remain in the DOM. A fixed + inert sibling
  // can freeze the whole document, and translate-x-full still occupies a hit box.
  if (!open || isVendorOpsPath(pathname)) return null;

  return (
    <>
      <div
        role="presentation"
        onClick={() => setOpen(false)}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 pointer-events-auto"
      >
        <div className="h-full bg-[#0a0a0c] text-white border-l border-white/10 shadow-2xl flex flex-col">
          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Your cart</h2>
              <p className="text-xs text-white/45 mt-0.5">
                {itemCount === 0
                  ? "No items yet"
                  : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close cart"
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center px-6 py-16">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-7 h-7 text-white/35" />
                </div>
                <p className="text-base font-medium text-white/80">Your cart is empty</p>
                <p className="mt-2 text-sm text-white/40 max-w-xs leading-relaxed">
                  Browse LookFinesse Shop for fashion, beauty, and wellness from Kenyan creators.
                </p>
                <Link
                  href="/shop"
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-gray-100 transition"
                >
                  Start shopping
                </Link>
              </div>
            ) : (
              cart.map((item: any) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10"
                >
                  <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url || "/placeholder.png"}
                      alt={item.name || "Product"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.id}`}
                        onClick={() => setOpen(false)}
                        className="font-medium text-sm text-white truncate hover:text-purple-200 transition"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="p-1.5 rounded-lg text-red-300/80 hover:text-red-200 hover:bg-red-500/10 transition shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-white/40 mt-0.5">
                      {formatKes(item.price)} each
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {formatKes(item.price * (item.quantity || 1))}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => decrease(item.id)}
                        aria-label="Decrease quantity"
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-medium">
                        {item.quantity || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => increase(item.id)}
                        aria-label="Increase quantity"
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 border-t border-white/10 space-y-3 safe-area-inset-bottom">
            {cart.length > 0 && (
              <div className="flex justify-between items-baseline text-base font-bold">
                <span className="text-white/70 font-medium">Total</span>
                <span>{formatKes(total)}</span>
              </div>
            )}

            {cart.length > 0 ? (
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="block text-center bg-white text-black py-3.5 rounded-2xl font-semibold hover:bg-gray-100 transition"
              >
                Proceed to checkout
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="w-full text-center bg-white/10 text-white/35 py-3.5 rounded-2xl font-semibold cursor-not-allowed"
              >
                Proceed to checkout
              </button>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full text-sm text-white/45 hover:text-white transition py-1"
            >
              {cart.length > 0 ? "Continue shopping" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
