"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";

export default function FollowButton({ vendorId }: { vendorId: string }) {
  const { userId } = useCurrentUser();
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !vendorId) return;
    fetch(`/api/follows?follower_id=${userId}&vendor_id=${vendorId}`)
      .then((r) => r.json())
      .then((d) => setFollowing(d.following));
  }, [userId, vendorId]);

  const toggle = async () => {
    if (!userId) {
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/reels";
      toast.error("Sign in to follow creators");
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ follower_id: userId, vendor_id: vendorId }),
    });
    const data = await res.json();
    setFollowing(data.following);
    setLoading(false);
    toast.success(data.following ? "Following!" : "Unfollowed");
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
        following
          ? "bg-white/10 border border-white/20 text-white/70 hover:bg-white/15"
          : "bg-white text-black hover:bg-white/90"
      } ${loading ? "opacity-50 cursor-wait" : ""}`}
    >
      {following ? (
        <>
          <UserCheck className="w-3 h-3" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-3 h-3" />
          Follow
        </>
      )}
    </button>
  );
}
