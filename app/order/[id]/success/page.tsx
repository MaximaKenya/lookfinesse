"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string | undefined;

  const [statusText, setStatusText] = useState("Confirming your payment…");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) { setError(true); return; }
    let cancelled = false;

    const run = async () => {
      try {
        setStatusText("Payment confirmed ✓");

        await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        if (cancelled) return;

        setStatusText("Preparing your order…");
        setReady(true);

        setTimeout(() => {
          if (!cancelled) router.replace(`/order/${orderId}`);
        }, 2200);
      } catch (err) {
        console.error("Success page error:", err);
        if (!cancelled) {
          setStatusText("Something went wrong processing your payment.");
          setError(true);
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [orderId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white px-4">
      {/* Glows */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-green-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="bg-white/[0.04] border border-white/10 backdrop-blur-xl rounded-3xl p-10 space-y-6 shadow-2xl">

          {/* Icon */}
          <div className="flex justify-center">
            {!error ? (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${
                ready
                  ? "bg-green-500/20 border-green-500/40"
                  : "border-white/10"
              }`}>
                {ready ? (
                  <span className="text-4xl text-green-400">✓</span>
                ) : (
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-green-400 animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <span className="text-4xl text-red-400">✗</span>
              </div>
            )}
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h1 className={`text-xl font-semibold ${error ? "text-red-400" : ready ? "text-green-400" : "text-white"}`}>
              {statusText}
            </h1>
            {!error && (
              <p className="text-sm text-gray-400">
                {ready ? "Redirecting to your order…" : "Please wait a moment"}
              </p>
            )}
            {!orderId && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                Missing order reference
              </p>
            )}
          </div>

          {/* Action */}
          {orderId && ready && (
            <Link
              href={`/order/${orderId}`}
              className="block w-full py-3 rounded-2xl bg-gradient-to-r from-green-500 to-cyan-500 text-white font-medium text-sm text-center"
            >
              View Order →
            </Link>
          )}
          {error && orderId && (
            <Link
              href={`/order/${orderId}`}
              className="block w-full py-3 rounded-2xl border border-white/20 text-white text-sm text-center hover:bg-white/10 transition"
            >
              Go to Order
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
