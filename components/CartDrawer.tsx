"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function CartDrawer() {
const { cart, open, setOpen, remove, increase, decrease } = useCart();
const total = cart.reduce(
  (sum: number, p: any) => sum + p.price * (p.quantity || 1),
  0
);


  return (
    <>
      {/* BACKDROP */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        />
      )}

      {/* CART PANEL */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full bg-gradient-to-b from-[#0f0f11] via-[#111827] to-black text-white border-l border-white/10 shadow-2xl flex flex-col">

          {/* HEADER */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <p className="text-xs text-gray-400">
                {cart.length} item(s)
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* ITEMS */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
           {cart.length === 0 ? (
  <div className="text-center text-gray-500 mt-20">
    Your cart is empty 🛒
  </div>
) : (
  cart.map((item: any) => (
  <div
    key={item.id}
    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10"
  >
    <div className="flex gap-3 items-center">

      {/* IMAGE */}
      <img
        src={item.image_url || "/placeholder.png"}
        className="w-12 h-12 object-cover rounded-lg"
      />

      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-xs text-gray-400">
  KES {item.price} × {item.quantity}
</p>

<p className="text-sm font-semibold">
  KES {item.price * item.quantity}
</p>

        {/* QTY CONTROLS */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => decrease(item.id)}
            className="px-2 bg-white/10 rounded"
          >
            -
          </button>

          <span>{item.quantity}</span>

          <button
            onClick={() => increase(item.id)}
            className="px-2 bg-white/10 rounded"
          >
            +
          </button>
        </div>
      </div>

    </div>

    <button
      onClick={() => remove(item.id)}
      className="text-red-400 text-sm"
    >
      Remove
    </button>
  </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div className="p-5 border-t border-white/10 space-y-4">

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>KES {total}</span>
            </div>

            <Link
  href="/checkout"
  onClick={() => setOpen(false)}
  className="block text-center bg-white text-black py-3 rounded-xl font-semibold"
>
  Proceed to Checkout →
</Link>

            <button
              onClick={() => setOpen(false)}
              className="w-full text-sm text-gray-400"
            >
              Continue shopping
            </button>

          </div>

        </div>
      </div>
    </>
  );
}