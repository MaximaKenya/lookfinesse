"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import VendorGateBanner from "@/components/creator/VendorGateBanner";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  isDemoMode?: boolean;
  hasVendorStore?: boolean;
  children: React.ReactNode;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "5xl" | "6xl";
};

const WIDTH: Record<NonNullable<Props["maxWidth"]>, string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export default function CreatorPageShell({
  title,
  subtitle,
  backHref = "/dashboard/creator-studio",
  backLabel = "Creator Studio",
  isDemoMode = false,
  hasVendorStore = false,
  children,
  maxWidth = "2xl",
}: Props) {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white relative overflow-hidden">
      <div className="fixed top-0 left-1/4 w-[400px] h-[400px] bg-purple-600/8 blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[350px] h-[350px] bg-pink-600/6 blur-[160px] pointer-events-none" />

      <div className={`relative z-10 ${WIDTH[maxWidth]} mx-auto px-4 sm:px-6 py-8 space-y-6`}>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>

        <header>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-white/40 mt-1">{subtitle}</p>}
        </header>

        <VendorGateBanner isDemoMode={isDemoMode} hasVendorStore={hasVendorStore} />

        {children}
      </div>
    </div>
  );
}
