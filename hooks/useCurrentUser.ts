"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Fast path: local session prevents sidebar / auth UI flash on hydration.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user?.id) {
          setUserId(session.user.id);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    async function validateUser() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (mounted) {
          setUserId(userData.user?.id ?? null);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }

    void validateUser();

    let sub: { subscription: { unsubscribe: () => void } } | null = null;
    try {
      const result = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setUserId(session?.user?.id ?? null);
          setLoading(false);
        }
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

  return { userId, loading };
}

/** Session-scoped dedupe + light debounce for /api/behavior view spam. */
const trackedViews = new Set<string>();
const pendingViews = new Map<string, ReturnType<typeof setTimeout>>();

export function trackView(
  userId: string | null,
  entityType: string,
  entityId: string,
  category?: string
) {
  if (!userId || !entityId) return;

  const key = `${userId}:${entityType}:${entityId}`;
  if (trackedViews.has(key)) return;
  if (pendingViews.has(key)) return;

  const timer = setTimeout(() => {
    pendingViews.delete(key);
    if (trackedViews.has(key)) return;
    trackedViews.add(key);
    fetch("/api/behavior", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        event_type: "view",
        category,
      }),
    }).catch(() => {
      trackedViews.delete(key);
    });
  }, 400);

  pendingViews.set(key, timer);
}
