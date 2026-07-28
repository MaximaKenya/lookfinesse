"use client";

import { useEffect } from "react";
import { signOutAndRedirect } from "@/lib/logout";

export default function LogoutPage() {
  useEffect(() => {
    void signOutAndRedirect("/login");
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-8 py-6 text-center">
        <p className="text-white/60 text-sm">Signing you out…</p>
      </div>
    </div>
  );
}
