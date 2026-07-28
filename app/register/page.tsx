"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import AuthCarousel from "@/components/auth/AuthCarousel";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback?returnUrl=/onboarding`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data?.session) {
      router.push("/onboarding");
      return;
    }

    setSuccess(true);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?returnUrl=/onboarding`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
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
          <div className="text-5xl">✉️</div>
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-black px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-white/90 transition-all"
          >
            Back to Login
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
                <p className="text-white/70 mt-2 text-sm leading-relaxed">Start your LookFinesse journey today</p>
              </motion.div>

              <motion.button
                custom={2}
                variants={fadeUp}
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? "Redirecting..." : "Sign up with Google"}
              </motion.button>

              <motion.div custom={3} variants={fadeUp} className="flex items-center gap-3">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-xs text-white/50">or</span>
                <div className="h-px bg-white/10 flex-1" />
              </motion.div>

              <motion.form custom={4} variants={fadeUp} onSubmit={handleRegister} className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-pink-500/50 focus:bg-black/40 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
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
                  className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  {error}
                </motion.p>
              )}

              <motion.p custom={5} variants={fadeUp} className="text-center text-sm text-white/70">
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
