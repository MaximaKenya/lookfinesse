"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [status, setStatus] = useState<"checking" | "waiting" | "paid" | "failed">("checking");
  const [reconciling, setReconciling] = useState(false);
  const [reconcileMsg, setReconcileMsg] = useState("");
  const [pollCount, setPollCount] = useState(0);

  const checkStatus = useCallback(async () => {
    if (!id) return false;
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) return false;
      const data = await res.json();
      if (data.status === "paid" || data.payment_status === "paid") {
        setStatus("paid");
        setTimeout(() => router.push(`/order/${id}/success`), 800);
        return true;
      }
      if (data.status === "failed" || data.payment_status === "failed") {
        setStatus("failed");
        return true;
      }
      setStatus("waiting");
      return false;
    } catch {
      return false;
    }
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    let pollInterval: ReturnType<typeof setInterval>;

    const init = async () => {
      const done = await checkStatus();
      if (!mounted || done) return;

      // Primary fix: poll every 3 seconds (works even when callback can't reach localhost)
      pollInterval = setInterval(async () => {
        if (!mounted) return;
        setPollCount((c) => c + 1);
        const isDone = await checkStatus();
        if (isDone) clearInterval(pollInterval);
      }, 3000);

      // Also subscribe to realtime for instant update when callback fires
      const channel = supabase
        .channel(`orders-${id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `id=eq.${id}` },
          (payload) => {
            if (!mounted) return;
            const order = payload.new as any;
            if (order.status === "paid") {
              setStatus("paid");
              clearInterval(pollInterval);
              setTimeout(() => router.push(`/order/${id}/success`), 800);
            }
            if (order.status === "failed") {
              setStatus("failed");
              clearInterval(pollInterval);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = init();

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      cleanup.then((fn) => fn?.());
    };
  }, [id, checkStatus, router]);

  const handleReconcile = async () => {
    if (!id || reconciling) return;
    setReconciling(true);
    setReconcileMsg("");
    try {
      const res = await fetch("/api/mpesa/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();
      if (data.status === "paid") {
        setReconcileMsg("Payment confirmed! Redirecting...");
        setStatus("paid");
        setTimeout(() => router.push(`/order/${id}/success`), 1200);
      } else if (data.status === "failed") {
        setReconcileMsg("Payment not found or failed.");
        setStatus("failed");
      } else {
        setReconcileMsg(data.message || "Still processing — try again in a moment.");
      }
    } catch {
      setReconcileMsg("Check failed. Please try again.");
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f11] via-[#111827] to-black text-white relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl text-center space-y-6">

          {/* WAITING */}
          {(status === "checking" || status === "waiting") && (
            <>
              {/* M-Pesa logo area */}
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Waiting for M-Pesa</h1>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Check your phone for the STK push prompt. Enter your PIN to complete payment.
                </p>
              </div>

              {/* Animated dots */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-green-400"
                    style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>

              <p className="text-xs text-gray-600">
                {status === "checking" ? "Connecting..." : `Polling for update${pollCount > 0 ? ` (${pollCount})` : ""}...`}
              </p>

              {/* Separator */}
              <div className="border-t border-white/10" />

              {/* Manual reconcile */}
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Already entered your PIN?</p>
                <button
                  onClick={handleReconcile}
                  disabled={reconciling}
                  className="w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition disabled:opacity-50 font-medium text-sm"
                >
                  {reconciling ? "Checking M-Pesa..." : "I've paid — verify now"}
                </button>
                {reconcileMsg && (
                  <p className="text-xs text-center text-gray-400">{reconcileMsg}</p>
                )}
              </div>

              <p className="text-xs text-gray-600">
                Page auto-refreshes every 3 seconds
              </p>
            </>
          )}

          {/* SUCCESS */}
          {status === "paid" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-green-400">Payment Confirmed!</h1>
              <p className="text-gray-400 text-sm">Redirecting to your order...</p>
            </>
          )}

          {/* FAILED */}
          {status === "failed" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-red-400">Payment Failed</h1>
              <p className="text-gray-400 text-sm">You cancelled or the request timed out.</p>
              <button
                onClick={() => router.back()}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm"
              >
                Try again
              </button>
            </>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
