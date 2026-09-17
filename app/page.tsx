import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Clapperboard,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";

const FEATURES = [
  {
    icon: ShoppingBag,
    title: "Shop creators",
    body: "Fashion, beauty, and wellness from Kenyan creators and vendors — pay with M-Pesa or card.",
    href: "/shop",
  },
  {
    icon: Clapperboard,
    title: "Social feed",
    body: "Follow drops, reels, and live sessions from the creators you love.",
    href: "/feed",
  },
  {
    icon: Sparkles,
    title: "AI stylist",
    body: "Get outfit ideas and beauty tips tailored to your look and fit profile.",
    href: "/ai/stylist",
  },
];

const TRUST = [
  { icon: Smartphone, label: "M-Pesa checkout" },
  { icon: ShieldCheck, label: "Secure payments" },
  { icon: ShoppingBag, label: "Creator marketplace" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/4 h-[420px] w-[420px] rounded-full bg-purple-600/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-rose-500/15 blur-[130px]" />
        <div className="absolute top-1/2 left-0 h-[280px] w-[280px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <BrandLogo href="/" size="md" />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/shop"
            className="hidden sm:inline-flex rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition"
          >
            Shop
          </Link>
          <Link
            href="/feed"
            className="hidden sm:inline-flex rounded-full border border-white/12 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition"
          >
            Feed
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/12 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white/80 hover:text-white transition"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-black hover:bg-gray-100 transition"
          >
            Join
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/55">
            <Sparkles className="h-3 w-3 text-purple-300" />
            Kenya fashion · beauty · fitness
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            LookFinesse — shop the culture,
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              {" "}
              live the look
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/55 leading-relaxed sm:text-lg">
            A social marketplace for creators and buyers. Discover drops, book services,
            and checkout with M-Pesa — built for Nairobi and beyond.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-black hover:bg-gray-100 transition shadow-xl shadow-white/10"
            >
              Browse shop
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/feed"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Open feed
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {TRUST.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/55"
            >
              <Icon className="h-3.5 w-3.5 text-purple-300" />
              {label}
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, href }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-purple-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white group-hover:text-purple-100 transition">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/45">{body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-purple-300">
                Explore
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-rose-500/10 p-8 sm:p-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Sell on LookFinesse</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">
            Open a storefront, go live, and get paid. Vendors manage products, orders, and payouts
            from one command center.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-gray-100 transition"
            >
              Create account
            </Link>
            <Link
              href="/vendor"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 hover:bg-white/5 transition"
            >
              Vendor dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
