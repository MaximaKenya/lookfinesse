"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const CartContext = createContext<any>(null);

/** Vendor/admin shells must never keep a shopper cart sheet mounted. */
export function isVendorOpsPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/vendor" ||
    pathname.startsWith("/vendor/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/intelligence" ||
    pathname.startsWith("/intelligence/") ||
    pathname === "/finance" ||
    pathname.startsWith("/finance/")
  );
}

export function CartProvider({ children }: any) {
  const pathname = usePathname();
  const [cart, setCart] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isVendorOpsPath(pathname)) setOpen(false);
  }, [pathname]);

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

    if (!isVendorOpsPath(pathname)) setOpen(true);
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