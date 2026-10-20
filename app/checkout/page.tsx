"use client";



import { useCart } from "@/context/CartContext";

import { Suspense, useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";

import { useRouter, useSearchParams } from "next/navigation";

import { Calendar, Loader2 } from "lucide-react";

import { getProduct } from "@/lib/marketplace";

import Link from "next/link";
import CheckoutCurrencyPicker from "@/components/checkout/CheckoutCurrencyPicker";
import { CheckoutWhatsAppShare } from "@/components/commerce/WhatsAppCommerce";
import DeliveryPanel, { type DeliveryDetails } from "@/components/checkout/DeliveryPanel";



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



function CheckoutInner() {

  const { cart } = useCart();

  const searchParams = useSearchParams();

  const directProduct = searchParams.get("product");

  const bookingId = searchParams.get("booking_id");

  const router = useRouter();




  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [extra, setExtra] = useState<CartItem | null>(null);

  const [booking, setBooking] = useState<BookingCheckout | null>(null);

  const [bookingLoading, setBookingLoading] = useState(!!bookingId);

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);



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



  const payWithPaystack = async (userId?: string, email?: string) => {
    const payload = isBookingCheckout
      ? {
          amount: total,
          userId,
          email,
          bookingId: booking.id,
          description: `Booking: ${booking.services?.title ?? "Service"}`,
        }
      : { amount: total, userId, email, cart: items, delivery };

    const res = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not start Paystack checkout");
    if (data?.url) window.location.href = data.url;
  };

  const pay = async () => {

    setError(null);

    try {

      setLoading(true);



      const {

        data: { user },

      } = await supabase.auth.getUser();



      await payWithPaystack(user?.id, user?.email ?? undefined);

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



            {items.length === 0 && !bookingLoading && (

              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
                <p className="text-sm font-medium text-white/70">Your cart is empty</p>
                <p className="mt-1 text-xs text-white/40">Add products from the shop to checkout.</p>
                <Link
                  href="/shop"
                  className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black"
                >
                  Browse shop
                </Link>
              </div>

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

          <DeliveryPanel hidden={isBookingCheckout} onChange={setDelivery} />

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl space-y-5">

            <h2 className="text-lg font-semibold">Payment Method</h2>



            <div className="rounded-2xl bg-black/30 border border-white/10 p-4 text-sm text-white/80 leading-relaxed space-y-2">
                <p>Pay with card, M-Pesa, or bank transfer on Paystack. We only confirm the order after Paystack verifies the payment.</p>
                <p className="text-xs text-white/60">Amount is in Kenyan shillings. You will return here when the payment is confirmed.</p>
              </div>

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

              {loading ? "Processing…" : `Pay KES ${total.toLocaleString()} with Paystack`}

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

