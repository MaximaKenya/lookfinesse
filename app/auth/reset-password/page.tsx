"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import BrandLogo from "@/components/brand/BrandLogo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        return;
      }
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("type=recovery") || hash.includes("access_token")) {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated — sign in with your new password");
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8 space-y-6">
        <div className="flex justify-center">
          <BrandLogo href="/feed" size="md" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Choose a new password</h2>
          <p className="text-white/40 text-sm mt-1">LookFinesse account recovery</p>
        </div>

        {!ready ? (
          <p className="text-sm text-white/50 text-center">
            Open the link from your email to continue.{" "}
            <Link href="/forgot-password" className="text-purple-400">
              Request a new link
            </Link>
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
            />
            <input
              type="password"
              placeholder="Confirm password"
              minLength={6}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-sm disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-white/40">
          <Link href="/login" className="text-purple-400 hover:text-purple-300">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
