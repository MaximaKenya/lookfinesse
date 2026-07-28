"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ShoppingBag, Gift, Calendar, Radio, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { DEMO_LIVE_SESSIONS, DEMO_PRODUCTS } from "@/lib/social/queries";

type Params = { id: string };

export default function LiveDetailPage({ params }: { params: Promise<Params> }) {
  const { userId } = useCurrentUser();
  const [session, setSession] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [tip, setTip] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const [tipLoading, setTipLoading] = useState(false);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then(({ id: resolvedId }) => {
      setId(resolvedId);

      // Handle demo IDs immediately
      if (resolvedId.startsWith("demo-")) {
        const demoSession = DEMO_LIVE_SESSIONS.find((s) => s.id === resolvedId);
        if (demoSession) {
          setSession(demoSession);
          setProducts(DEMO_PRODUCTS.slice(0, 6));
          return;
        }
      }

      supabase
        .from("live_sessions")
        .select(`*, vendors ( id, name, avatar_url )`)
        .eq("id", resolvedId)
        .single()
        .then(({ data }) => {
          if (data) {
            setSession(data);
          } else {
            // Fallback to first demo session
            setSession(DEMO_LIVE_SESSIONS[0]);
          }
        });

      supabase
        .from("products")
        .select("id, name, price, image_url, vendor_id")
        .or(`vendor_id.eq.${resolvedId},vendor_id.is.null`)
        .limit(6)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setProducts(data);
          } else {
            supabase
              .from("products")
              .select("id, name, price, image_url")
              .limit(6)
              .then(({ data: fallback }) => setProducts(fallback && fallback.length > 0 ? fallback : DEMO_PRODUCTS.slice(0, 6)));
          }
        });
    });
  }, [params]);

  const sendTip = async () => {
    if (!userId) { toast.error("Sign in to tip"); return; }
    const amount = parseInt(tip);
    if (!amount || amount < 50) { toast.error("Minimum tip is KES 50"); return; }
    setTipLoading(true);
    try {
      await fetch("/api/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tip",
          user_id: userId,
          session_id: id,
          amount,
          message: tipMessage || undefined,
        }),
      });
      toast.success(`Sent KES ${amount} tip!`);
      setTip("");
      setTipMessage("");
    } catch {
      toast.error("Tip failed");
    } finally {
      setTipLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="aspect-video bg-white/5 rounded-3xl" />
        <div className="h-8 bg-white/5 rounded-2xl w-2/3" />
      </div>
    );
  }

  const vendorName = session.vendors?.name ?? "Creator";

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Session header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          {session.is_live ? (
            <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE NOW
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/60 text-[10px] font-bold px-3 py-1.5 rounded-full">
              UPCOMING
            </span>
          )}
          {session.viewer_count > 0 && (
            <span className="inline-flex items-center gap-1.5 text-white/50 text-xs">
              <Users className="w-3.5 h-3.5" />
              {session.viewer_count.toLocaleString()} watching
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white">{session.title}</h1>
        <Link href={`/creator/${session.vendor_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {session.vendors?.avatar_url && (
            <img src={session.vendors.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          )}
          <span className="text-white/60 text-sm">{vendorName}</span>
        </Link>
      </header>

      {/* Stream embed / cover */}
      <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/8">
        {session.stream_url && session.is_live ? (
          <iframe src={session.stream_url} className="absolute inset-0 w-full h-full" allowFullScreen />
        ) : session.cover_url ? (
          <>
            <img src={session.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            {session.is_live && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Radio className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
                  <p className="text-white font-semibold">Live now — stream loading…</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Radio className="w-16 h-16 text-white/15" />
            <p className="text-white/30 text-sm">
              {session.is_live ? "Stream loading..." : `Starts ${new Date(session.scheduled_for).toLocaleString()}`}
            </p>
          </div>
        )}
        {session.is_live && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white/80 text-xs font-semibold">LIVE</span>
          </div>
        )}
      </div>

      {session.description && (
        <p className="text-white/60 leading-relaxed">{session.description}</p>
      )}

      {/* Commerce bar */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Join/Watch */}
        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-white">Watch Live</h3>
          </div>
          {session.stream_url && session.is_live ? (
            <a href={session.stream_url} target="_blank" rel="noreferrer" className="block text-center bg-red-500 hover:bg-red-400 text-white py-3 rounded-2xl font-bold transition-all">
              Join Session
            </a>
          ) : (
            <p className="text-sm text-white/40 text-center py-2">
              Starts {new Date(session.scheduled_for).toLocaleString("en-KE", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <Link
            href={`/services?vendor=${session.vendor_id}`}
            className="block text-center border border-white/15 text-white/60 py-2.5 rounded-2xl text-sm font-medium hover:bg-white/5 transition-all"
          >
            Book with {vendorName}
          </Link>
        </div>

        {/* Tip */}
        <div className="bg-[#0f0f0f] border border-yellow-500/15 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-white">Send a Tip</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[50, 100, 500, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => setTip(String(amt))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  tip === String(amt) ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "border-white/10 text-white/50 hover:border-white/25"
                }`}
              >
                KES {amt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              placeholder="Custom amount"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25"
            />
            <button
              onClick={sendTip}
              disabled={tipLoading || !tip}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
            >
              {tipLoading ? "..." : "Tip"}
            </button>
          </div>
          <input
            value={tipMessage}
            onChange={(e) => setTipMessage(e.target.value)}
            placeholder="Add a message (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25"
          />
        </div>

        {/* Buy products */}
        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">Shop This Session</h3>
          </div>
          <div className="space-y-2">
            {products.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/product/${p.id}`}>
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all">
                  {p.image_url && (
                    <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">{p.name}</p>
                    <p className="text-white/40 text-[11px]">KES {p.price?.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/shop" className="block text-center text-purple-400 text-xs font-semibold hover:text-purple-300 transition-colors">
            View all products →
          </Link>
        </div>
      </div>
    </section>
  );
}
