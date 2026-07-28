import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getAccessToken, getTimestamp, generatePassword } from "@/lib/mpesa";
import { getRequestOrigin } from "@/lib/url";

type CartItem = { id: string; price: number; quantity?: number };

function formatPhone(phone: string) {
  if (phone.startsWith("07")) return "254" + phone.slice(1);
  if (phone.startsWith("+254")) return phone.replace("+", "");
  return phone;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const origin = getRequestOrigin(req);

    const {
      phone,
      amount,
      userId,
      cart,
      accountReference,
      description,
      metadata,
    } = body as {
      phone: string;
      amount: number;
      userId?: string;
      cart?: CartItem[];
      accountReference?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    };

    const isServicePayment = !!metadata?.kind;
    const bookingId = (metadata?.booking_id as string) ?? null;
    const isBookingPayment = metadata?.kind === "booking" && !!bookingId;

    if (!phone || !amount) {
      return NextResponse.json({ message: "Missing phone or amount" }, { status: 400 });
    }

    if (!isServicePayment && !isBookingPayment && !cart?.length) {
      return NextResponse.json({ message: "Missing cart items" }, { status: 400 });
    }

    const formattedPhone = formatPhone(phone);
    let vendorId: string | null = (metadata?.vendor_id as string) ?? null;
    let orderId: string | null = null;

    if (isBookingPayment && bookingId) {
      const { data: bookingRow } = await supabase
        .from("bookings")
        .select("vendor_id, total_amount, payment_status")
        .eq("id", bookingId)
        .single();
      if (!bookingRow) {
        return NextResponse.json({ message: "Booking not found" }, { status: 404 });
      }
      if (bookingRow.payment_status === "paid") {
        return NextResponse.json({ message: "Booking already paid" }, { status: 400 });
      }
      vendorId = bookingRow.vendor_id;
    } else if (!isServicePayment && cart?.length) {
      if (cart[0]?.id) {
        const { data: productRow } = await supabase
          .from("products")
          .select("store_id, stores(user_id)")
          .eq("id", cart[0].id)
          .single();
        if (productRow?.stores) {
          const stores = productRow.stores as { user_id?: string } | { user_id?: string }[];
          vendorId = Array.isArray(stores) ? stores[0]?.user_id ?? null : stores?.user_id ?? null;
        }
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId ?? null,
          vendor_id: vendorId,
          total: Number(amount),
          phone: formattedPhone,
          status: "pending",
        })
        .select()
        .single();

      if (orderError || !order) {
        return NextResponse.json({ message: "Order creation failed", error: orderError }, { status: 500 });
      }

      orderId = order.id;
      await supabase.from("order_items").insert(
        cart.map((p) => ({
          order_id: order.id,
          product_id: p.id,
          quantity: p.quantity || 1,
          price: p.price,
        }))
      );
    }

    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    if (!accessToken) {
      return NextResponse.json({ message: "Failed to generate access token" }, { status: 500 });
    }

    const accountRef = accountReference ?? orderId ?? `LF-${Date.now()}`;

    const stkRes = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: process.env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Number(amount),
          PartyA: formattedPhone,
          PartyB: process.env.MPESA_SHORTCODE,
          PhoneNumber: formattedPhone,
          CallBackURL: `${origin}/api/mpesa/callback`,
          AccountReference: accountRef,
          TransactionDesc: description ?? "LookFinesse Payment",
        }),
      }
    );

    const rawText = await stkRes.text();
    let data: { ResponseCode?: string; CheckoutRequestID?: string; MerchantRequestID?: string; errorCode?: string } | null = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      return NextResponse.json({ message: "Invalid JSON from MPESA", raw: rawText }, { status: 500 });
    }

    if (!data || data.errorCode) {
      return NextResponse.json({ message: "STK push failed", error: data }, { status: 500 });
    }

    if (data.ResponseCode === "0") {
      await supabase.from("payments").insert({
        order_id: orderId,
        booking_id: isBookingPayment ? bookingId : null,
        vendor_id: vendorId,
        provider: "mpesa",
        status: "pending",
        amount: Number(amount),
        phone: formattedPhone,
        checkout_request_id: data.CheckoutRequestID,
        merchant_request_id: data.MerchantRequestID,
        metadata: metadata ?? {},
      });

      return NextResponse.json({
        success: true,
        message: "STK push sent",
        orderId,
        bookingId: isBookingPayment ? bookingId : undefined,
        checkoutRequestId: data.CheckoutRequestID,
      });
    }

    return NextResponse.json({ message: "Unexpected MPESA response", data }, { status: 500 });
  } catch (err) {
    console.error("STK SERVER ERROR:", err);
    return NextResponse.json({ message: "Server error", error: String(err) }, { status: 500 });
  }
}
