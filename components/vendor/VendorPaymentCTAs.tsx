import Link from "next/link";
import { Crown, Megaphone, Wallet, Sparkles } from "lucide-react";

type Props = {
  variant?: "hub" | "finance" | "products" | "inline";
  className?: string;
};

export default function VendorPaymentCTAs({ variant = "inline", className = "" }: Props) {
  const cards = [
    {
      href: "/dashboard/subscription",
      icon: Crown,
      title: "Upgrade plan",
      desc: "Unlock ads, live commerce & intelligence",
      accent: "from-amber-500/20 to-rose-500/10 border-amber-500/25 text-amber-200",
    },
    {
      href: "/dashboard/ads",
      icon: Megaphone,
      title: "Promote listings",
      desc: "Boost products & services with ad credits",
      accent: "from-violet-500/20 to-fuchsia-500/10 border-violet-500/25 text-violet-200",
    },
    {
      href: "/dashboard/vendor/wallet",
      icon: Wallet,
      title: "Top up wallet",
      desc: "Fund ads & payouts via M-Pesa or card",
      accent: "from-cyan-500/20 to-blue-500/10 border-cyan-500/25 text-cyan-200",
    },
  ];

  if (variant === "products") {
    return (
      <div className={`rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 text-center space-y-4 ${className}`}>
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-white/70 text-sm">No products yet — add your first listing or upgrade for higher limits.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/create-product" className="px-4 py-2 rounded-xl bg-white text-black text-sm font-bold">
            Add product
          </Link>
          <Link href="/dashboard/subscription" className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-100 text-sm font-semibold">
            Upgrade plan
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "finance") {
    return (
      <div className={`grid sm:grid-cols-2 gap-3 ${className}`}>
        {cards.filter((c) => c.href !== "/dashboard/ads").map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`rounded-2xl border bg-gradient-to-br p-4 hover:opacity-90 transition-all ${c.accent}`}
          >
            <c.icon className="w-5 h-5 mb-2" />
            <p className="font-bold text-white text-sm">{c.title}</p>
            <p className="text-xs text-white/55 mt-0.5">{c.desc}</p>
          </Link>
        ))}
      </div>
    );
  }

  if (variant === "hub") {
    return (
      <div className={`grid sm:grid-cols-3 gap-3 ${className}`}>
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`rounded-2xl border bg-gradient-to-br p-4 hover:scale-[1.02] transition-all ${c.accent}`}
          >
            <c.icon className="w-5 h-5 mb-2" />
            <p className="font-bold text-white text-sm">{c.title}</p>
            <p className="text-xs text-white/55 mt-0.5">{c.desc}</p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {cards.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/80 hover:bg-white/10"
        >
          <c.icon className="w-3.5 h-3.5" />
          {c.title}
        </Link>
      ))}
    </div>
  );
}
