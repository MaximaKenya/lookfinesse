"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const ADMIN_SEED_HINT =
  "Run supabase/seed_demo_metrics.sql then supabase/seed_admin_finance.sql on the Heroku-linked Supabase project.";

export function AdminKpiTile({
  label,
  value,
  href,
  helper,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  href: string;
  helper: string;
  tone: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-3xl border p-5 sm:p-6 transition-all ${tone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            {label}
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-white truncate">
            {value}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 inline-flex items-center gap-1">
            {helper}
            <ArrowUpRight className="h-3 w-3 text-zinc-600 group-hover:text-white transition" />
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/40 border border-white/10">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

export function AdminEmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 text-center space-y-4">
      <h2 className="text-xl font-bold text-amber-100">{title}</h2>
      <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
        {hint ?? ADMIN_SEED_HINT}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/admin/finance"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/10"
        >
          Admin Finance
        </Link>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
        >
          Open Supabase SQL
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

export function AdminPanel({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-3xl border border-white/8 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
