"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export type VendorContext = {
  vendorId: string | null;
  vendorName: string | null;
  storeId: string | null;
  loading: boolean;
  /** True when falling back to demo vendor (no real store). */
  isDemoMode: boolean;
  /** True when user owns a vendor row or store. */
  hasVendorStore: boolean;
};

export function useVendorContext(): VendorContext {
  const { userId, loading: authLoading } = useCurrentUser();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [hasVendorStore, setHasVendorStore] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setVendorId(null);
      setVendorName(null);
      setStoreId(null);
      setIsDemoMode(false);
      setHasVendorStore(false);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/vendor/context", { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        setVendorId(typeof data.vendorId === "string" ? data.vendorId : null);
        setVendorName(typeof data.vendorName === "string" ? data.vendorName : null);
        setStoreId(typeof data.storeId === "string" ? data.storeId : null);
        setHasVendorStore(Boolean(data.hasVendorStore && data.vendorId));
        setIsDemoMode(Boolean(data.isDemoMode) || !data.vendorId);
      } catch {
        if (!mounted) return;
        setVendorId(null);
        setVendorName(null);
        setStoreId(null);
        setIsDemoMode(true);
        setHasVendorStore(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [userId, authLoading]);

  return {
    vendorId,
    vendorName,
    storeId,
    loading: authLoading || loading,
    isDemoMode,
    hasVendorStore,
  };
}
