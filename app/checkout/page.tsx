"use client";



import { useCart } from "@/context/CartContext";

import { Suspense, useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";

import { useRouter, useSearchParams } from "next/navigation";

import { CreditCard, Smartphone, Calendar, Loader2 } from "lucide-react";

import { getProduct } from "@/lib/marketplace";

import Link from "next/link";
import CheckoutCurrencyPicker from "@/components/checkout/CheckoutCurrencyPicker";
import { CheckoutWhatsAppShare } from "@/components/commerce/WhatsAppCommerce";



type CartItem = {

  id: string;

  name: string;

  price: number;

  quantity?: number;

  image_url?: string | null;

};



type BookingCheckout = {

  id: string;

  total_amount: number;

  vendor_id: string;

  payment_status: string;

  services?: { title?: string; cover_image?: string | null };

  vendors?: { business_name?: string; name?: string };

  availability_slots?: { starts_at?: string };

};



type PaymentMethod = "mpesa" | "card";



const STRIPE_CONFIGURED = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const MPESA_CONFIGURED = !!process.env.NEXT_PUBLIC_MPESA_ENABLED;



function CheckoutInner() {

  const { cart } = useCart();

  const searchParams = useSearchParams();

  const directProduct = searchParams.get("product");

  const bookingId = searchParams.get("booking_id");

  const router = useRouter();



  const [method, setMethod] = useState<PaymentMethod>("mpesa");

  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [extra, setExtra] = useState<CartItem | null>(null);

  const [booking, setBooking] = useState<BookingCheckout | null>(null);

  const [bookingLoading, setBookingLoading] = useState(!!bookingId);

  const [bookingError, setBookingError] = useState<string | null>(null);



  useEffect(() => {

    if (!bookingId) return;

    let cancelled = false;

    async function loadBooking() {

      setBookingLoading(true);

      setBookingError(null);

      const {

        data: { user },

      } = await supabase.auth.getUser();

      if (!user) {

        router.push(`/login?returnUrl=${encodeURIComponent(`/checkout?booking_id=${bookingId}`)}`);

        return;

      }

      const res = await fetch(`/api/bookings/${bookingId}`, { credentials: "include" });

      if (cancelled) return;

      if (res.status === 401) {

        router.push(`/login?returnUrl=${encodeURIComponent(`/checkout?booking_id=${bookingId}`)}`);

        return;

      }

      if (!res.ok) {

        const payload = await res.json().catch(() => ({}));

        setBooking(null);

        setBookingError(payload.error ?? "Booking not found or you do not have access.");

        setBookingLoading(false);

        return;

      }

      setBooking(await res.json());

      setBookingLoading(false);

    }

    void loadBooking();

    return () => {

      cancelled = true;

    };

  }, [bookingId, router]);



  useEffect(() => {

    if (!directProduct || bookingId) return;

    getProduct(directProduct).then((p) => {

      if (!p) return;

      setExtra({

        id: p.id,

        name: p.name,

        price: Number(p.price),

        image_url: p.image_url ?? (Array.isArray(p.images) ? p.images[0] : null),

        quantity: 1,

      });

    });

  }, [directProduct, bookingId]);



  const isBookingCheckout = !!bookingId && !!booking;

  const items: CartItem[] = isBookingCheckout

    ? [

        {

          id: booking.id,

          name: booking.services?.title ?? "Service booking",

          price: Number(booking.total_amount ?? 0),

          quantity: 1,

          image_url: booking.services?.cover_image ?? null,

        },

      ]

    : extra && !cart.find((c: CartItem) => c.id === extra.id)

      ? [extra, ...cart]

      : cart;



  const total = isBookingCheckout

    ? Number(booking.total_amount ?? 0)

    : items.reduce((sum: number, item: CartItem) => sum + item.price * (item.quantity || 1), 0);



  const payWithMpesa = async (userId?: string) => {

    if (!phone.trim()) throw new Error("Enter your M-Pesa phone number");



    if (isBookingCheckout) {

      const res = await fetch("/api/mpesa/stk", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          phone: phone.trim(),

          amount: total,

          userId,

          accountReference: `BK-${booking.id.slice(0, 8)}`,

          description: `Booking: ${booking.services?.title ?? "Service"}`,

          metadata: {

            kind: "booking",

            booking_id: booking.id,

            vendor_id: booking.vendor_id,

          },

        }),

      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "M-Pesa push failed");

      router.push(`/bookings?paid=pending&booking_id=${booking.id}`);

      return;

    }



    const res = await fetch("/api/mpesa/stk", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ phone: phone.trim(), amount: total, userId, cart: items }),

    });



    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "M-Pesa push failed");



    if (data?.orderId) {

      router.push(`/order/${data.orderId}/processing`);

    }

  };



  const payWithStripe = async (userId?: string) => {

    const payload = isBookingCheckout

      ? { amount: total, userId, bookingId: booking.id, description: `Booking: ${booking.services?.title ?? "Service"}` }

      : { amount: total, userId, cart: items };



    const res = await fetch("/api/stripe/create-session", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(payload),

    });



    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to start card payment");



    if (data?.url) {

      window.location.href = data.url;

    }

  };



  const pay = async () => {

    setError(null);

    try {

      setLoading(true);



      const {

        data: { user },

      } = await supabase.auth.getUser();



      if (method === "mpesa") {

        await payWithMpesa(user?.id);

      } else {

        await payWithStripe(user?.id);

      }

    } catch (err: unknown) {

      const msg = err instanceof Error ? err.message : "Payment failed. Try again.";

      setError(msg);

    } finally {

      setLoading(false);

    }

  };



  if (bookingId && bookingLoading) {

    return (

      <div className="min-h-screen bg-gradient-to-br from-[#0f0f11] via-[#111827] to-black text-white flex items-center justify-center">

        <Loader2 className="w-8 h-8 animate-spin text-white/40" />

      </div>

    );

  }



  if (bookingId && !booking) {

    return (

      <div className="min-h-screen bg-gradient-to-br from-[#0f0f11] via-[#111827] to-black text-white flex items-center justify-center p-6">

        <div className="text-center space-y-4">

          <p className="text-white/60">{bookingError ?? "Booking not found or access denied."}</p>

          <Link href="/bookings" className="text-cyan-400 hover:underline text-sm">

            Back to bookings

          </Link>

        </div>

      </div>

    );

  }



  if (isBookingCheckout && booking.payment_status === "paid") {

    return (

      <div className="min-h-screen bg-gradient-to-br from-[#0f0f11] via-[#111827] to-black text-white flex items-center justify-center p-6">

        <div className="text-center space-y-4 max-w-md">

          <p className="text-green-400 font-semibold">This booking is already paid.</p>

          <Link href="/bookings" className="inline-block bg-white text-black px-6 py-3 rounded-xl font-semibold">

            View bookings

          </Link>

        </div>

      </div>

    );

  }



  return (

    <div className="min-h-screen bg-gradient-to-br from-[#0f0f11] via-[#111827] to-black text-white p-6">

      <div className="max-w-4xl mx-auto space-y-8">

        <div>

          <h1 className="text-3xl font-semibold">

            {isBookingCheckout ? "Complete Booking Payment" : "Secure Checkout"}

          </h1>

          <p className="text-gray-400 mt-1">

            {isBookingCheckout ? "Pay to confirm your appointment" : "Choose your payment method"}

          </p>

        </div>



        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-xl">

            <h2 className="text-lg font-semibold">

              {isBookingCheckout ? "Booking Summary" : "Order Summary"}

            </h2>



            {isBookingCheckout && booking.availability_slots?.starts_at && (

              <div className="flex items-center gap-2 text-sm text-cyan-300/80 bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-2">

                <Calendar className="w-4 h-4 shrink-0" />

                {new Date(booking.availability_slots.starts_at).toLocaleString("en-KE", {

                  weekday: "short",

                  month: "short",

                  day: "numeric",

                  hour: "2-digit",

                  minute: "2-digit",

                })}

              </div>

            )}



            {items.length === 0 && (

              <p className="text-sm text-gray-500">Your cart is empty.</p>

            )}



            {items.map((item: CartItem) => {

              const qty = item.quantity || 1;

              return (

                <div

                  key={item.id}

                  className="flex items-center justify-between text-sm text-gray-300"

                >

                  <div className="flex items-center gap-3">

                    <img

                      src={item.image_url || "/placeholder.png"}

                      alt={item.name}

                      className="w-10 h-10 rounded-lg object-cover"

                    />

                    <div>

                      <p>{item.name}</p>

                      {isBookingCheckout && (

                        <p className="text-xs text-gray-500">

                          {booking.vendors?.business_name ?? booking.vendors?.name}

                        </p>

                      )}

                      {!isBookingCheckout && (

                        <p className="text-xs text-gray-500">x{qty}</p>

                      )}

                    </div>

                  </div>

                  <span>KES {(item.price * qty).toLocaleString()}</span>

                </div>

              );

            })}



            <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-base">

              <span>Total</span>

              <span>KES {total.toLocaleString()}</span>

            </div>

          </div>

          <CheckoutCurrencyPicker totalKes={total} />

          <CheckoutWhatsAppShare totalKes={total} />

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl space-y-5">

            <h2 className="text-lg font-semibold">Payment Method</h2>



            <div className="grid grid-cols-2 gap-3">

              <button

                onClick={() => setMethod("mpesa")}

                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-sm font-medium transition-all ${

                  method === "mpesa"

                    ? "bg-white text-black border-white"

                    : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"

                }`}

              >

                <Smartphone className="w-4 h-4 shrink-0" />

                M-Pesa

              </button>



              <button

                onClick={() => setMethod("card")}

                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-sm font-medium transition-all ${

                  method === "card"

                    ? "bg-white text-black border-white"

                    : "border-white/10 text-white/60 hover:border-white/25 hover:text-white"

                }`}

              >

                <CreditCard className="w-4 h-4 shrink-0" />

                Card

              </button>

            </div>



            {method === "mpesa" && (

              <div className="space-y-2">

                <label className="text-xs text-gray-400 uppercase tracking-wider">

                  Safaricom Number

                </label>

                <input

                  value={phone}

                  onChange={(e) => setPhone(e.target.value)}

                  placeholder="2547XXXXXXXX"

                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none text-white placeholder-white/30 focus:border-white/30 transition-colors"

                />

                <p className="text-xs text-gray-500">

                  An STK push will be sent to this number.

                </p>

                {!MPESA_CONFIGURED && (

                  <p className="text-[11px] text-yellow-400/80 bg-yellow-500/8 border border-yellow-500/20 rounded-lg px-3 py-2">

                    Demo: set <code>NEXT_PUBLIC_MPESA_ENABLED=1</code> and configure Daraja keys in <code>.env.local</code> for live M-Pesa.

                  </p>

                )}

              </div>

            )}



            {method === "card" && (

              <div className="rounded-2xl bg-black/30 border border-white/8 p-4 text-sm text-gray-400 leading-relaxed space-y-2">

                <p>You will be redirected to a secure Stripe checkout page to complete payment with your card.</p>

                {!STRIPE_CONFIGURED && (

                  <p className="text-[11px] text-yellow-400/80 bg-yellow-500/8 border border-yellow-500/20 rounded-lg px-3 py-2">

                    Demo: set <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and Stripe secret keys in <code>.env.local</code> for live card payments.

                  </p>

                )}

              </div>

            )}



            {error && (

              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">

                {error}

              </p>

            )}



            <button

              onClick={pay}

              disabled={loading || items.length === 0}

              className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-40 transition-all"

            >

              {loading

                ? "Processing…"

                : method === "mpesa"

                  ? `Pay KES ${total.toLocaleString()} with M-Pesa`

                  : `Pay KES ${total.toLocaleString()} with Card`}

            </button>

          </div>

        </div>

      </div>

    </div>

  );

}



export default function CheckoutPage() {

  return (

    <Suspense fallback={<div className="min-h-screen bg-black text-white/60 flex items-center justify-center">Loading checkout…</div>}>

      <CheckoutInner />

    </Suspense>

  );

}

