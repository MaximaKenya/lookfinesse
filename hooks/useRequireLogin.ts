"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useRequireLogin() {
  const router = useRouter();

  return (userId: string | null, returnUrl?: string) => {
    if (userId) return true;
    const dest =
      returnUrl ??
      (typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/reels");
    toast.error("Sign in to continue");
    router.push(`/login?returnUrl=${encodeURIComponent(dest)}`);
    return false;
  };
}
