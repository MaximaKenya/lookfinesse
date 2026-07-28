"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type Role = "admin" | "vendor" | "user";

export function useUserRole() {
  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setError(false);
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id ?? null;
        if (!mounted) return;

        setUserId(uid);
        if (!uid) {
          setRole(null);
          return;
        }

        // 1. Explicit roles in user_roles (admin / vendor / user)
        const { data: rows, error: rolesErr } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid);

        if (!rolesErr && rows && rows.length > 0) {
          const roles = rows.map((r) => r.role);
          if (roles.includes("admin")) {
            setRole("admin");
            return;
          }
          if (roles.includes("vendor")) {
            setRole("vendor");
            return;
          }
        }

        // 2. Fallback: own a vendors row (seed links vendor@test.com here)
        const { data: vendorRows, error: vendorErr } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", uid)
          .limit(1);

        if (!vendorErr && vendorRows && vendorRows.length > 0) {
          setRole("vendor");
          return;
        }

        // 3. Fallback: own a store → vendor
        const { data: storeRows, error: storeErr } = await supabase
          .from("stores")
          .select("id")
          .eq("user_id", uid)
          .limit(1);

        if (!storeErr && storeRows && storeRows.length > 0) {
          setRole("vendor");
          return;
        }

        // Query failure without ownership proof: do NOT freeze as shopper forever
        if (rolesErr || vendorErr || storeErr) {
          setError(true);
          // Keep any previously resolved role; leave null if first load failed
          return;
        }

        setRole("user");
      } catch {
        if (mounted) {
          setError(true);
          // Preserve last known role — never force shopper on transient failures
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    let sub: { subscription: { unsubscribe: () => void } } | null = null;
    try {
      const result = supabase.auth.onAuthStateChange(() => {
        void load();
      });
      sub = result.data;
    } catch {
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  return {
    role,
    userId,
    loading,
    error,
    /** Platform admin — bypasses all subscription / vendor gates when true. */
    isAdmin: role === "admin",
    /** Vendor cockpit access; admins always count as vendors. */
    isVendor: role === "vendor" || role === "admin",
  };
}
