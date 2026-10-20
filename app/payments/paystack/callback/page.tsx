"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const reference = params.get("reference") || params.get("trxref") || "";
  const [message, setMessage] = useState("Confirming your payment with Paystack…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!reference) {
      setFailed(true);
      setMessage("Paystack did not return a payment reference.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.ok) {
          router.replace(`/checkout/success?reference=${encodeURIComponent(reference)}`);
          return;
        }
        setFailed(true);
        setMessage(data.message || "Payment was not completed. Nothing was charged into your order.");
      } catch {
        if (!cancelled) {
          setFailed(true);
          setMessage("We could not reach Paystack to verify this payment.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reference, router]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 text-white">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-8 space-y-4">
        <h1 className="text-2xl font-semibold">{failed ? "Payment not confirmed" : "Checking Paystack"}</h1>
        <p className="text-white/80 leading-relaxed">{message}</p>
        {reference ? <p className="text-xs text-white/50 break-all">Reference {reference}</p> : null}
        {failed ? (
          <Link href="/checkout" className="inline-flex rounded-xl bg-white text-black px-4 py-2 font-semibold">
            Back to checkout
          </Link>
        ) : null}
      </div>
    </main>
  );
}

export default function PaystackCallbackPage() {
  return (
    <Suspense fallback={<main className="min-h-[70vh] text-white p-10">Checking Paystack…</main>}>
      <CallbackInner />
    </Suspense>
  );
}
