"use client";

import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export type InfraTile = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  border?: string;
};

export function InfrastructureNav({
  title,
  subtitle,
  tiles,
}: {
  title: string;
  subtitle?: string;
  tiles: InfraTile[];
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(({ href, label, description, icon: Icon, accent, border }) => (
          <Link
            key={href}
            href={href}
            className={`group flex flex-col rounded-2xl border bg-white/[0.03] p-4 transition-all hover:bg-white/[0.07] hover:border-white/15 ${
              border ?? "border-white/8"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 ${accent}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition" />
            </div>
            <div className="mt-4 font-semibold text-sm text-white">{label}</div>
            <p className="mt-1 text-[11px] text-zinc-500 leading-snug">
              {description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ClickableKpi({
  href,
  label,
  value,
  prefix = "",
  border,
  gradient,
  icon,
}: {
  href: string;
  label: string;
  value: number;
  prefix?: string;
  border: string;
  gradient: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-5 space-y-3 transition hover:scale-[1.01] hover:border-white/20`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-center gap-1">
          {icon}
          <ArrowUpRight className="h-3 w-3 text-zinc-600 group-hover:text-white transition" />
        </div>
      </div>
      <p className="text-2xl font-bold">
        {prefix}
        {value.toLocaleString()}
      </p>
    </Link>
  );
}
