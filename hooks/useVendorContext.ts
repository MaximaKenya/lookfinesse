"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DEMO_VENDOR_ID } from "@/lib/creator/constants";
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
        const { data: vendor } = await supabase
          .from("vendors")
          .select("id, business_name, name")
          .eq("user_id", userId)
          .maybeSingle();

        const { data: store } = await supabase
          .from("stores")
          .select("id, name")
          .eq("user_id", userId)
          .maybeSingle();

        if (!mounted) return;

        if (vendor?.id) {
          setVendorId(vendor.id);
          setVendorName(vendor.business_name || vendor.name || "Your Store");
          setStoreId(store?.id ?? null);
          setHasVendorStore(true);
          setIsDemoMode(false);
        } else if (store?.id) {
          setStoreId(store.id);
          setVendorId(DEMO_VENDOR_ID);
          setVendorName(store.name || "Your Store");
          setHasVendorStore(true);
          setIsDemoMode(true);
        } else {
          setStoreId(null);
          setVendorId(DEMO_VENDOR_ID);
          setVendorName("Demo Creator");
          setHasVendorStore(false);
          setIsDemoMode(true);
        }
      } catch {
        if (!mounted) return;
        setVendorId(DEMO_VENDOR_ID);
        setVendorName("Demo Creator");
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
