import { NextResponse } from "next/server";
import { z } from "zod";
import { fulfillPaystackReference } from "@/lib/paystack/fulfill";
import { isPaystackConfigured } from "@/lib/paystack/client";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  reference: z.string().min(4).max(80),
});

/** Browser return path. Always verifies with Paystack before granting value. */
export async function GET(req: Request) {
  if (!rateLimit(`paystack-verify:${clientIp(req)}`, 30, 60_000)) return tooManyRequests();
  if (!isPaystackConfigured()) {
    return NextResponse.json({ message: "Paystack is not configured" }, { status: 503 });
  }
  const reference = new URL(req.url).searchParams.get("reference") ?? "";
  const parsed = schema.safeParse({ reference });
  if (!parsed.success) {
    return NextResponse.json({ message: "Missing payment reference" }, { status: 400 });
  }
  try {
    const result = await fulfillPaystackReference(parsed.data.reference);
    const status = result.ok ? 200 : result.status === "pending" || result.status === "abandoned" ? 202 : 400;
    return NextResponse.json(result, { status });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Verification failed" },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  if (!rateLimit(`paystack-verify:${clientIp(req)}`, 30, 60_000)) return tooManyRequests();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Missing payment reference" }, { status: 400 });
  }
  try {
    const result = await fulfillPaystackReference(parsed.data.reference);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Verification failed" },
      { status: 502 }
    );
  }
}
