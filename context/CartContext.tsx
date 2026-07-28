"use client";

import { createContext, useContext, useState } from "react";

const CartContext = createContext<any>(null);

export function CartProvider({ children }: any) {
  const [cart, setCart] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const add = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);

      if (existing) {
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, quantity: (p.quantity || 1) + 1 }
            : p
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });

    setOpen(true);
  };

  const increase = (id: string) => {
    setCart((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
      )
    );
  };

  const decrease = (id: string) => {
    setCart((prev) =>
      prev
        .map((p) =>
          p.id === id
            ? { ...p, quantity: Math.max((p.quantity || 1) - 1, 1) }
            : p
        )
        .filter((p) => p.quantity > 0)
    );
  };

  const remove = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const clear = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        add,
        increase,
        decrease,
        remove,
        clear,
        open,
        setOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      cart: [],
      add: () => {},
      increase: () => {},
      decrease: () => {},
      remove: () => {},
      clear: () => {},
      open: false,
      setOpen: () => {},
    };
  }
  return ctx;
};