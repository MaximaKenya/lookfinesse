"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { AdCampaign } from "@/lib/ads/getPersonalizedAds";
import { randomUUID } from "@/lib/utils/uuid";

interface Props {
  userId?: string | null;
  sessionId?: string | null;
}

const AUTOPLAY_MS = 5000;

function generateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const key = "lf_sid";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return randomUUID();
  }
}

async function trackEvent(
  type: "impression" | "click",
  campaignId: string,
  userId?: string | null,
  sessionId?: string | null,
  impressionId?: string | null
) {
  return fetch("/api/ads/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      campaign_id: campaignId,
      user_id: userId ?? undefined,
      session_id: sessionId ?? undefined,
      impression_id: impressionId ?? undefined,
      placement: "hero_carousel",
    }),
  })
    .then((r) => r.json())
    .catch(() => ({}));
}

export default function HeroAdCarousel({ userId, sessionId: propSessionId }: Props) {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);
  const impressionIds = useRef<Record<string, string | null>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sid = useRef<string>("");

  useEffect(() => {
    sid.current = propSessionId ?? generateSessionId();
  }, [propSessionId]);

  // Fetch personalized ads
  useEffect(() => {
    const params = new URLSearchParams({ limit: "6" });
    if (userId) params.set("user_id", userId);
    if (sid.current) params.set("session_id", sid.current);

    fetch(`/api/ads/serve?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAds(data);
          setLoaded(true);
        }
      })
      .catch(() => {});
  }, [userId]);

  // Track impression when slide becomes visible
  useEffect(() => {
    if (!loaded || !ads[current]) return;
    const ad = ads[current];
    if (impressionIds.current[ad.id] !== undefined) return;

    impressionIds.current[ad.id] = null; // mark as pending
    trackEvent("impression", ad.id, userId, sid.current).then((res) => {
      if (res?.impression_id) {
        impressionIds.current[ad.id] = res.impression_id;
      }
    });
  }, [current, loaded, ads, userId]);

  // Autoplay
  const advance = useCallback(() => {
    setCurrent((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  useEffect(() => {
    if (!loaded || paused || ads.length <= 1) return;
    timerRef.current = setTimeout(advance, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, loaded, paused, advance, ads.length]);

  const prev = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent((c) => (c - 1 + ads.length) % ads.length);
  };
  const next = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advance();
  };

  const handleClick = (ad: AdCampaign) => {
    const iid = impressionIds.current[ad.id] ?? undefined;
    trackEvent("click", ad.id, userId, sid.current, iid ?? null);
  };

  if (!loaded || ads.length === 0) return null;

  const ad = ads[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl select-none"
      style={{ aspectRatio: "16/7", minHeight: 200 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Background image with gradient overlay */}
      {ads.map((a, i) => (
        <div
          key={a.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.image_url}
            alt={a.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Gradient: bottom-up dark fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          {/* Subtle purple/pink glow from bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/30 to-transparent pointer-events-none" />
        </div>
      ))}

      {/* Glassmorphism content card */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        {/* Sponsored badge */}
        <span className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/15 text-white/60 text-[10px] font-semibold px-2.5 py-1 rounded-full mb-2.5 tracking-wider uppercase">
          ✦ Sponsored
        </span>

        {/* Headline */}
        <h2 className="text-xl md:text-2xl font-bold text-white leading-tight mb-1 drop-shadow-lg line-clamp-2">
          {ad.headline}
        </h2>

        {/* Description */}
        {ad.description && (
          <p className="text-sm text-white/70 mb-3 line-clamp-1 drop-shadow">
            {ad.description}
          </p>
        )}

        {/* CTA */}
        <Link
          href={ad.cta_url}
          onClick={() => handleClick(ad)}
          className="inline-flex items-center gap-2 bg-white text-black font-bold text-sm px-5 py-2.5 rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-lg shadow-black/30"
        >
          {ad.cta_text}
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Left / Right nav arrows */}
      {ads.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous ad"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/60 transition-all active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next ad"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:bg-black/60 transition-all active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {ads.length > 1 && (
        <div className="absolute top-3 right-4 flex items-center gap-1.5">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setCurrent(i);
              }}
              aria-label={`Go to ad ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
        {!paused && (
          <div
            key={`${current}-${paused}`}
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
            style={{
              animation: `adProgress ${AUTOPLAY_MS}ms linear forwards`,
            }}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes adProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}
