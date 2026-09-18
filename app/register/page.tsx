"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import AuthCarousel from "@/components/auth/AuthCarousel";
import {
  friendlyAuthError,
  isDuplicateSignup,
  persistIntendedRole,
  validateSignupInput,
  type IntendedAccountKind,
} from "@/lib/auth/signupErrors";
import { hardNavigate } from "@/lib/auth/onboarding";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ShoppingBag, Store } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [kind, setKind] = useState<IntendedAccountKind>("shopper");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function bootstrap(intended: IntendedAccountKind, name: string) {
    await fetch("/api/auth/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intendedRole: intended, username: name }),
    }).catch(() => {});
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!isSupabaseConfigured()) {
      setError(friendlyAuthError("SUPABASE_MISCONFIGURED"));
      return;
    }

    const invalid = validateSignupInput({ email, password, username });
    if (invalid) {
      setError(invalid);
      return;
    }

    setLoading(true);
    persistIntendedRole(kind);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim(), intended_role: kind, display_name: username.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?returnUrl=/onboarding`,
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(friendlyAuthError(signUpError.message));
      return;
    }

    if (isDuplicateSignup(data?.user)) {
      setLoading(false);
      setError("An account with this email already exists. Sign in, or reset your password.");
      return;
    }

    if (data?.session) {
      await bootstrap(kind, username.trim());
      setLoading(false);
      hardNavigate("/onboarding");
      return;
    }

    setLoading(false);
    setSuccess(true);
  }

  async function handleGoogle() {
    if (!isSupabaseConfigured()) {
      setError(friendlyAuthError("SUPABASE_MISCONFIGURED"));
      return;
    }
    setGoogleLoading(true);
    setError(null);
    persistIntendedRole(kind);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?returnUrl=/onboarding`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (oauthError) {
      setError(friendlyAuthError(oauthError.message));
      setGoogleLoading(false);
    }
  }

  async function resendConfirmation() {
    setResending(true);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?returnUrl=/onboarding` },
    });
    setResending(false);
    if (resendError) setError(friendlyAuthError(resendError.message));
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8"
        >
          <BrandLogo href="/feed" size="md" className="mx-auto justify-center" />
          <div className="text-5xl" aria-hidden>
            ✉️
          </div>
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it
            to activate your {kind === "vendor" ? "vendor" : "shopper"} account. Check spam if it
            is not in your inbox within a minute.
          </p>
          <button
            type="button"
            onClick={() => void resendConfirmation()}
            disabled={resending}
            className="text-sm text-purple-300 hover:text-purple-200 underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend confirmation email"}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Link
            href="/login"
            className="inline-block bg-white text-black px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-white/90 transition-all"
          >
            Already confirmed? Sign in
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="md:hidden">
        <AuthCarousel accent="pink" compact />
      </div>

      <div className="grid md:grid-cols-2 min-h-[calc(100vh-0px)] md:min-h-screen">
        <div className="hidden md:block">
          <AuthCarousel accent="pink" />
        </div>

        <div className="flex items-center justify-center p-6 md:p-10">
          <motion.div initial="hidden" animate="show" className="w-full max-w-md">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-pink-900/20 p-6 sm:p-8 space-y-6">
              <motion.div custom={0} variants={fadeUp} className="flex justify-center md:justify-start">
                <BrandLogo href="/feed" size="md" />
              </motion.div>
              <motion.div custom={1} variants={fadeUp} className="text-center md:text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pink-400/90 mb-2">
                  LookFinesse
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Create account</h2>
                <p className="text-white/70 mt-2 text-sm leading-relaxed">
                  Shop, book, and sell — one Kenya-first marketplace.
                </p>
              </motion.div>

              <motion.div custom={2} variants={fadeUp} className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKind("shopper")}
                  className={`flex flex-col items-start gap-1 rounded-2xl border px-3 py-3 text-left transition ${
                    kind === "shopper"
                      ? "border-pink-400/60 bg-pink-500/15"
                      : "border-white/10 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-pink-300" />
                  <span className="text-sm font-semibold">Shopper</span>
                  <span className="text-[11px] text-white/45">Buy, book, follow creators</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKind("vendor")}
                  className={`flex flex-col items-start gap-1 rounded-2xl border px-3 py-3 text-left transition ${
                    kind === "vendor"
                      ? "border-cyan-400/60 bg-cyan-500/15"
                      : "border-white/10 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <Store className="w-4 h-4 text-cyan-300" />
                  <span className="text-sm font-semibold">Vendor</span>
                  <span className="text-[11px] text-white/45">Sell products or services</span>
                </button>
              </motion.div>

              <motion.button
                custom={3}
                variants={fadeUp}
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? "Redirecting..." : "Sign up with Google"}
              </motion.button>

              <motion.div custom={4} variants={fadeUp} className="flex items-center gap-3">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-xs text-white/50">or</span>
                <div className="h-px bg-white/10 flex-1" />
              </motion.div>

              <motion.form custom={5} variants={fadeUp} onSubmit={handleRegister} className="space-y-4">
                <label className="sr-only" htmlFor="reg-username">
                  Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  autoComplete="username"
                  placeholder="Username"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={2}
                  maxLength={32}
                />
                <label className="sr-only" htmlFor="reg-email">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label className="sr-only" htmlFor="reg-password">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Password (min 8 characters)"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <p className="text-[11px] text-white/40">
                  {kind === "vendor"
                    ? "After confirming, you will personalize then launch your store (30-day Pro trial)."
                    : "After confirming, a short style profile unlocks Today tips and For You."}
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-pink-900/30"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </motion.form>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  {error}
                </motion.p>
              )}

              <motion.p custom={6} variants={fadeUp} className="text-center text-sm text-white/70">
                Already have an account?{" "}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign in
                </Link>
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
