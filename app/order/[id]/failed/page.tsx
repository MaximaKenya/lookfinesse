"use client";

import { useParams, useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function OrderFailedPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f11] via-[#111827] to-black text-white flex items-center justify-center p-6">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-5 backdrop-blur-xl">

        <div className="flex justify-center">
          <XCircle className="w-16 h-16 text-red-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Payment Failed</h1>
          <p className="text-gray-400 mt-2">
            Your payment could not be completed. No charge was made.
          </p>
        </div>

        {orderId && (
          <div className="bg-black/30 border border-white/8 rounded-2xl px-4 py-3 text-sm text-gray-500 font-mono">
            Order: {orderId}
          </div>
        )}

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
    </div>
  );
}
