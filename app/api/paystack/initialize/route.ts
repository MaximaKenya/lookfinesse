import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { getRequestOrigin } from "@/lib/url";
import {
  initializeTransaction,
  isPaystackConfigured,
  newPaystackReference,
  paystackCallbackUrl,
} from "@/lib/paystack/client";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cartItem = z.object({
  id: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive().optional(),
});

const bodySchema = z.object({
  amount: z.number().positive(),
  email: z.string().email().optional(),
  userId: z.string().optional(),
  cart: z.array(cartItem).optional(),
  orderId: z.string().optional(),
  bookingId: z.string().optional(),
  subscriptionId: z.string().optional(),
  description: z.string().max(180).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  delivery: z
    .object({
      fulfillment: z.string().optional(),
      address: z.string().max(240).optional(),
      city: z.string().max(80).optional(),
      notes: z.string().max(240).optional(),
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`paystack-init:${clientIp(req)}`, 12, 60_000)) return tooManyRequests();
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { message: "Paystack is not configured. Add PAYSTACK_SECRET_KEY to continue." },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Check the amount and try again." }, { status: 400 });
  }
  const body = parsed.data;

  let email = body.email;
  let userId = body.userId;
  try {
    const server = await createSupabaseServer();
    const {
      data: { user },
    } = await server.auth.getUser();
    if (user) {
      userId = user.id;
      email = email || user.email || undefined;
    }
  } catch {
    /* guest checkout */
  }
  if (!email) email = "checkout@lookfinesse.app";

  const reference = newPaystackReference();
  const origin = getRequestOrigin(req);
  const metadata: Record<string, string> = { ...(body.metadata ?? {}), app: "lookfinesse" };
  if (userId) metadata.user_id = userId;

  let orderId = body.orderId ?? null;
  let vendorId: string | null = metadata.vendor_id ?? null;
  const bookingId: string | null = body.bookingId ?? null;

  try {
    if (bookingId) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, vendor_id, payment_status")
        .eq("id", bookingId)
        .single();
      if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
      if (booking.payment_status === "paid") {
        return NextResponse.json({ message: "This booking is already paid" }, { status: 400 });
      }
      vendorId = booking.vendor_id;
      metadata.kind = metadata.kind || "booking";
      metadata.booking_id = bookingId;
    } else if (body.subscriptionId) {
      const { data: sub } = await supabase
        .from("customer_subscriptions")
        .select("id, vendor_id")
        .eq("id", body.subscriptionId)
        .single();
      if (!sub) return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
      vendorId = sub.vendor_id;
      metadata.kind = "service_subscription";
      metadata.subscription_id = body.subscriptionId;
    } else if (!orderId) {
      if (!body.cart?.length && metadata.kind !== "platform_sub" && metadata.kind !== "ad_campaign") {
        return NextResponse.json({ message: "Your cart is empty" }, { status: 400 });
      }
      if (body.cart?.length) {
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: userId ?? null,
            total: body.amount,
            status: "pending",
            fulfillment: body.delivery?.fulfillment ?? "delivery",
            delivery_address: body.delivery?.address ?? null,
            delivery_city: body.delivery?.city ?? null,
            delivery_lat: body.delivery?.lat ?? null,
            delivery_lng: body.delivery?.lng ?? null,
            delivery_notes: body.delivery?.notes ?? null,
          })
          .select()
          .single();
        if (orderError || !order) {
          return NextResponse.json({ message: "Could not create the order" }, { status: 500 });
        }
        orderId = order.id as string;
        metadata.order_id = orderId;
        await supabase.from("order_items").insert(
          body.cart.map((item) => ({
            order_id: orderId,
            product_id: item.id,
            quantity: item.quantity || 1,
            price: item.price,
          }))
        );
      }
    } else {
      metadata.order_id = orderId;
    }

    if (vendorId) metadata.vendor_id = vendorId;

    const session = await initializeTransaction({
      email,
      amountKes: body.amount,
      reference,
      callbackUrl: paystackCallbackUrl(origin),
      metadata,
    });

    const paymentRow: Record<string, unknown> = {
      order_id: orderId,
      booking_id: bookingId,
      vendor_id: vendorId,
      provider: "paystack",
      status: "pending",
      amount: body.amount,
      checkout_request_id: session.reference,
      provider_ref: session.reference,
      metadata,
    };

    let { error: paymentError } = await supabase.from("payments").insert(paymentRow);
    if (paymentError && /provider_ref/i.test(paymentError.message)) {
      delete paymentRow.provider_ref;
      const retry = await supabase.from("payments").insert(paymentRow);
      paymentError = retry.error;
    }
    if (paymentError) {
      console.error("[paystack] payment insert", paymentError);
      return NextResponse.json({ message: "Could not record the payment" }, { status: 500 });
    }

    return NextResponse.json({
      url: session.authorization_url,
      reference: session.reference,
      orderId,
      bookingId,
    });
  } catch (err) {
    console.error("[paystack] initialize", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Could not start Paystack checkout" },
      { status: 502 }
    );
  }
}
