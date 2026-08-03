"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";

async function registerSw(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (err) {
    console.warn("[push] SW register failed", err);
    return null;
  }
}

/** urlBase64ToUint8Array for VAPID public key */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushOptIn() {
  const { userId } = useCurrentUser();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setSupported(false);
      return;
    }
    setEnabled(Notification.permission === "granted");
    registerSw();
  }, []);

  const enable = async () => {
    if (!userId) {
      toast.error("Sign in to enable push alerts");
      return;
    }
    setLoading(true);
    try {
      const reg = await registerSw();
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.message("Notifications blocked — enable in browser settings");
        setLoading(false);
        return;
      }

      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      let subscription: PushSubscription | null = null;
      if (reg && vapid && "PushManager" in window) {
        try {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapid),
          });
        } catch (err) {
          console.warn("[push] subscribe without VAPID fallback", err);
        }
      }

      const json = subscription?.toJSON?.() ?? {};
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          endpoint: json.endpoint ?? `local-${userId}`,
          keys: json.keys ?? {},
          user_agent: navigator.userAgent,
        }),
      });

      // Local confirmation when FCM/VAPID not configured
      if (reg) {
        await reg.showNotification("LookFinesse alerts on", {
          body: "Order status, bookings, followers & low-stock alerts.",
          icon: "/logo-icon.svg",
          data: { url: "/notifications" },
        });
      }

      setEnabled(true);
      toast.success("Push notifications enabled");
    } catch (err) {
      console.error(err);
      toast.error("Could not enable push");
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <p className="text-sm text-white/40">
        Push notifications aren&apos;t supported in this browser. In-app alerts still work below.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={enable}
      disabled={loading || enabled}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : enabled ? (
        <Bell className="h-4 w-4 text-emerald-400" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {enabled ? "Push alerts on" : "Enable push alerts"}
    </button>
  );
}
