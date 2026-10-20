import { NextResponse } from "next/server";
import { fulfillPaystackReference } from "@/lib/paystack/fulfill";
import { isLookfinesseMetadata, verifyPaystackSignature } from "@/lib/paystack/client";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Paystack webhook. HMAC-SHA512 of the raw body must match x-paystack-signature.
 * Events that are not tagged lookfinesse are acknowledged and ignored.
 * Value is granted only after GET /transaction/verify/:reference succeeds.
 */
export async function POST(req: Request) {
  if (!rateLimit(`paystack-hook:${clientIp(req)}`, 120, 60_000)) return tooManyRequests();

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = event.data ?? {};
  const metadata =
    data.metadata && typeof data.metadata === "object"
      ? (data.metadata as Record<string, unknown>)
      : {};
  if (!isLookfinesseMetadata(metadata)) {
    return NextResponse.json({ ignored: true });
  }

  const reference = String(data.reference ?? "");
  if (!reference.startsWith("LF-")) {
    return NextResponse.json({ ignored: true });
  }

  if (event.event === "charge.success") {
    const result = await fulfillPaystackReference(reference);
    if (!result.ok && result.status !== "ignored" && result.status !== "pending") {
      return NextResponse.json(result, { status: result.status === "missing" ? 404 : 409 });
    }
    return NextResponse.json({ received: true, ...result });
  }

  return NextResponse.json({ received: true, ignored: event.event !== "charge.success" });
}
