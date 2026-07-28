import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getRequestOrigin } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CartItem = {
  id: string;
  price: number;
  quantity?: number;
};

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" as any });

  try {
    const body = await req.json();

    const {
      amount,
      userId,
      cart,
      orderId: existingOrderId,
      bookingId,
      subscriptionId,
      description,
    } = body as {
      amount: number;
      userId?: string;
      cart?: CartItem[];
      orderId?: string;
      bookingId?: string;
      subscriptionId?: string;
      description?: string;
    };

    if (!amount) {
      return NextResponse.json({ message: "Missing amount" }, { status: 400 });
    }

    const baseUrl = getRequestOrigin(req);
    let orderId = existingOrderId;
    let vendorId: string | null = null;
    let lineLabel = description ?? "Order Payment";
    const metadata: Record<string, string> = {};

    if (bookingId) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, vendor_id, total_amount, payment_status, services(title)")
        .eq("id", bookingId)
        .single();

      if (!booking) {
        return NextResponse.json({ message: "Booking not found" }, { status: 404 });
      }
      if (booking.payment_status === "paid") {
        return NextResponse.json({ message: "Booking already paid" }, { status: 400 });
      }

      vendorId = booking.vendor_id;
      const svc = booking.services as { title?: string } | { title?: string }[] | null;
      const title = Array.isArray(svc) ? svc[0]?.title : svc?.title;
      lineLabel = title ? `Booking: ${title}` : "Service Booking";
      metadata.kind = "booking";
      metadata.booking_id = bookingId;
    } else if (subscriptionId) {
      const { data: sub } = await supabase
        .from("customer_subscriptions")
        .select("id, vendor_id, status, service_plans(name, price_kes)")
        .eq("id", subscriptionId)
        .single();

      if (!sub) {
        return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
      }

      vendorId = sub.vendor_id;
      const plan = sub.service_plans as { name?: string; price_kes?: number } | null;
      lineLabel = plan?.name ? `Subscription: ${plan.name}` : "Monthly subscription";
      metadata.kind = "service_subscription";
      metadata.subscription_id = subscriptionId;
    } else if (!orderId) {
      if (!cart?.length) {
        return NextResponse.json(
          { message: "Missing cart items, bookingId, subscriptionId, or orderId" },
          { status: 400 }
        );
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId ?? null,
          total: Number(amount),
          status: "pending",
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error("❌ Order creation error:", orderError);
        return NextResponse.json(
          { message: "Order creation failed", error: orderError },
          { status: 500 }
        );
      }

      orderId = order.id as string;
      metadata.orderId = orderId;

      await supabase.from("order_items").insert(
        cart.map((p) => ({
          order_id: orderId,
          product_id: p.id,
          quantity: p.quantity || 1,
          price: p.price,
        }))
      );
    } else {
      metadata.orderId = orderId;
    }

    const successParams = bookingId
      ? `bookingId=${bookingId}`
      : subscriptionId
        ? `subscriptionId=${subscriptionId}`
        : `orderId=${orderId}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "kes",
            product_data: { name: lineLabel },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/checkout/success?${successParams}`,
      cancel_url: `${baseUrl}/checkout/failed?reason=cancelled${bookingId ? `&bookingId=${bookingId}` : subscriptionId ? `&subscriptionId=${subscriptionId}` : ""}`,
      metadata: Object.keys(metadata).length ? metadata : { orderId: orderId! },
    });

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: orderId ?? null,
      booking_id: bookingId ?? null,
      vendor_id: vendorId,
      provider: "stripe",
      status: "pending",
      amount: Number(amount),
      stripe_session_id: session.id,
      metadata: Object.keys(metadata).length ? metadata : { orderId: orderId! },
    });

    if (paymentError) {
      console.error("❌ Payment insert error:", paymentError);
    }

    return NextResponse.json({ url: session.url, orderId, bookingId });
  } catch (err) {
    console.error("🔥 Stripe session error:", err);
    return NextResponse.json(
      { message: "Stripe error", error: String(err) },
      { status: 500 }
    );
  }
}
