"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/lib/supabaseClient";
import { signOutAndRedirect } from "@/lib/logout";

export default function AuthHeaderActions() {
  const { userId, loading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, [userId]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await signOutAndRedirect("/login");
  }

  if (loading) {
    return <div className="h-9 w-24 rounded-full bg-white/5 animate-pulse" />;
  }

  if (!userId) {
    return (
      <div className="flex flex-nowrap items-center justify-end gap-2 shrink-0 min-w-0">
        <Link
          href="/login"
          className="inline-flex items-center whitespace-nowrap rounded-full border border-white/12 bg-white/[0.04] backdrop-blur-md px-3 sm:px-4 py-2 text-xs font-semibold text-white/80 hover:text-white hover:border-amber-400/30 hover:bg-amber-500/10 transition-all"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center whitespace-nowrap rounded-full border border-amber-400/35 bg-gradient-to-r from-amber-500/20 to-rose-500/20 backdrop-blur-md px-3 sm:px-4 py-2 text-xs font-semibold text-amber-100 hover:from-amber-500/30 hover:to-rose-500/30 transition-all shadow-lg shadow-amber-900/20"
        >
          Join
        </Link>
      </div>
    );
  }

  const initials = (email.split("@")[0] || "U").slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] backdrop-blur-md pl-1.5 pr-3 py-1.5 hover:border-amber-400/30 hover:bg-amber-500/10 transition-all"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/80 to-rose-600/80 text-xs font-bold text-white ring-2 ring-black/40">
          {initials}
        </span>
        <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[90] mt-2 w-52 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl shadow-black/50 py-2">
          <div className="px-4 py-2 border-b border-white/8">
            <p className="text-xs text-white/40 truncate">{email || "Signed in"}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-200 hover:text-rose-100 hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
