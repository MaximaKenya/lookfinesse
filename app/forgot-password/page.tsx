"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import AuthCarousel from "@/components/auth/AuthCarousel";
import BrandLogo from "@/components/brand/BrandLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
    toast.success("Check your email for the reset link");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="md:hidden">
        <AuthCarousel accent="purple" compact />
      </div>
      <div className="grid md:grid-cols-2 min-h-screen">
        <div className="hidden md:block">
          <AuthCarousel accent="purple" />
        </div>
        <div className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-purple-900/20 p-6 sm:p-8 space-y-6">
              <div className="flex justify-center md:justify-start">
                <BrandLogo href="/feed" size="md" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-400/80 mb-2">
                  LookFinesse
                </p>
                <h2 className="text-3xl font-bold">Reset password</h2>
                <p className="text-white/40 mt-1 text-sm">
                  We&apos;ll email you a link to choose a new password.
                </p>
              </div>

              {sent ? (
                <div className="space-y-4 text-center md:text-left">
                  <p className="text-sm text-white/60">
                    If <strong className="text-white">{email}</strong> is registered, you&apos;ll receive a reset link shortly.
                  </p>
                  <Link
                    href="/login"
                    className="inline-block w-full text-center py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-sm"
                  >
                    Back to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-sm disabled:opacity-60"
                  >
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                </form>
              )}

              <p className="text-center text-sm text-white/40">
                Remember your password?{" "}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
