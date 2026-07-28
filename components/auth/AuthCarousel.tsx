"use client";

import { useEffect, useState, useCallback } from "react";

import BrandLogo from "@/components/brand/BrandLogo";

interface Slide {
  type: "image" | "video";
  src: string;
  poster?: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=85&auto=format&fit=crop",
    title: "Sell beauty. Share style.",
    subtitle: "Kenya's AI-powered fashion, beauty & fitness platform.",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=85&auto=format&fit=crop",
    title: "Discover LookFinesse",
    subtitle: "Personalized outfit & skincare picks for Nairobi weather.",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1400&q=85&auto=format&fit=crop",
    title: "Book trainers. Join lives.",
    subtitle: "Workouts, facials, hair — discovered & booked in seconds.",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1400&q=85&auto=format&fit=crop",
    title: "Pay how you want",
    subtitle: "M-Pesa, Stripe, and instant cart checkout.",
  },
  {
    type: "image",
    src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&q=85&auto=format&fit=crop",
    title: "Creators earn here",
    subtitle: "Memberships, affiliate links and live commerce.",
  },
];

export default function AuthCarousel({
  accent = "purple",
  compact = false,
}: {
  accent?: "purple" | "pink";
  compact?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const dotActive = accent === "pink" ? "bg-pink-400" : "bg-purple-400";

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 5200);
    return () => clearInterval(t);
  }, []);

  const markLoaded = useCallback((i: number) => {
    setLoaded((prev) => ({ ...prev, [i]: true }));
  }, []);

  const slide = SLIDES[idx];
  const heightClass = compact ? "h-56 sm:h-64" : "min-h-[320px] md:min-h-full";

  return (
    <div className={`relative overflow-hidden bg-[#0a0a0a] ${heightClass}`}>
      {SLIDES.map((s, i) => (
        <div
          key={s.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === idx ? "opacity-100 z-[1]" : "opacity-0 z-0"
          }`}
        >
          {!loaded[i] && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-black to-pink-950/30 animate-pulse" />
          )}
          <img
            src={s.src}
            alt=""
            loading={i <= 1 ? "eager" : "lazy"}
            onLoad={() => markLoaded(i)}
            onError={() => markLoaded(i)}
            className="w-full h-full object-cover scale-105"
          />
        </div>
      ))}

      <div className="absolute inset-0 z-[2] bg-gradient-to-tr from-black/92 via-black/65 to-black/40" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/80 via-transparent to-black/20" />

      <div className={`relative z-[3] flex flex-col h-full ${compact ? "p-6" : "p-8 md:p-10 min-h-[320px] md:min-h-full"}`}>
        {!compact && (
          <div className="hidden md:block">
            <BrandLogo href="/feed" size="lg" />
          </div>
        )}
        <div className={compact ? "mt-auto space-y-2" : "mt-auto space-y-4"}>
          <h1
            className={`font-bold leading-tight tracking-tight text-white drop-shadow-lg ${
              compact ? "text-2xl" : "text-3xl xl:text-5xl"
            }`}
          >
            {slide.title}
          </h1>
          <p
            className={`text-white/85 leading-relaxed max-w-md drop-shadow-md ${
              compact ? "text-sm" : "text-base md:text-lg"
            }`}
          >
            {slide.subtitle}
          </p>
          <div className="flex gap-2 pt-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === idx ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? `w-10 ${dotActive}` : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
