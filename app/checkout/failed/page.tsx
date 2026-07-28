"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

function FailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reason = searchParams.get("reason");

  const label =
    reason === "cancelled"
      ? "Payment cancelled"
      : reason
      ? decodeURIComponent(reason)
      : "Payment was not completed";

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-5 backdrop-blur-xl">
      <div className="flex justify-center">
        <XCircle className="w-16 h-16 text-red-400" />
      </div>

      <div>
        <h1 className="text-2xl font-bold">Payment Failed</h1>
        <p className="text-gray-400 mt-2">{label}</p>
      </div>

      <div className="space-y-3 pt-2">
        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
        >
          Try Again
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full border border-white/10 text-white/60 py-3 rounded-xl text-sm hover:text-white hover:border-white/25 transition-all"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default function CheckoutFailedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f11] via-[#111827] to-black text-white flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-white/40">Loading...</div>}>
        <FailedContent />
      </Suspense>
    </div>
  );
}
