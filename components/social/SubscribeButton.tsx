"use client";

import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { Award } from "lucide-react";

export default function SubscribeButton({ vendorId, vendorName }: { vendorId: string; vendorName?: string }) {
  const { userId } = useCurrentUser();
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    if (!userId) {
      toast.error("Sign in to subscribe");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 299,
          userId,
          description: `Membership: ${vendorName ?? "creator"}`,
          metadata: {
            app: "lookfinesse",
            kind: "membership",
            user_id: userId,
            vendor_id: vendorId,
            tier: "supporter",
          },
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success(`Subscribed to ${vendorName ?? "creator"}!`);
      }
    } catch {
      toast.error("Subscription failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={subscribe}
      disabled={loading}
      className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
    >
      <Award className="w-3.5 h-3.5" />
      {loading ? "..." : "Subscribe"}
    </button>
  );
}
