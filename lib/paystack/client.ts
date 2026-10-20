import { createHmac, randomUUID, timingSafeEqual } from "crypto";

const API = "https://api.paystack.co";

export const PAYSTACK_CHANNELS = [
  "card",
  "mobile_money",
  "bank_transfer",
  "bank",
  "ussd",
] as const;

export function isPaystackConfigured(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim() ?? "";
  return key.startsWith("sk_") && key.length > 12;
}

export function newPaystackReference(): string {
  return `LF-${randomUUID()}`;
}

export function paystackCallbackUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/payments/paystack/callback`;
}

type InitInput = {
  email: string;
  amountKes: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
};

export type PaystackInitResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

async function paystackFetch(path: string, init?: RequestInit) {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new Error("Paystack is not configured");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: Record<string, unknown>;
  };
  if (!res.ok || json.status === false) {
    throw new Error(json.message || `Paystack request failed (${res.status})`);
  }
  return json;
}

export async function initializeTransaction(input: InitInput): Promise<PaystackInitResult> {
  const amount = Math.round(Number(input.amountKes) * 100);
  if (!Number.isFinite(amount) || amount < 100) {
    throw new Error("Amount must be at least KES 1");
  }
  const json = await paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount,
      currency: "KES",
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: [...PAYSTACK_CHANNELS],
      metadata: { ...input.metadata, app: "lookfinesse" },
    }),
  });
  const data = json.data ?? {};
  const authorization_url = String(data.authorization_url ?? "");
  const access_code = String(data.access_code ?? "");
  const reference = String(data.reference ?? input.reference);
  if (!authorization_url) throw new Error("Paystack did not return a checkout URL");
  return { authorization_url, access_code, reference };
}

export type VerifiedTransaction = {
  status: string;
  reference: string;
  amountSubunits: number;
  currency: string;
  metadata: Record<string, unknown>;
  gatewayResponse?: string;
};

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const safe = encodeURIComponent(reference);
  const json = await paystackFetch(`/transaction/verify/${safe}`, { method: "GET" });
  const data = json.data ?? {};
  const metadata =
    data.metadata && typeof data.metadata === "object"
      ? (data.metadata as Record<string, unknown>)
      : {};
  return {
    status: String(data.status ?? ""),
    reference: String(data.reference ?? reference),
    amountSubunits: Number(data.amount ?? 0),
    currency: String(data.currency ?? ""),
    metadata,
    gatewayResponse: data.gateway_response ? String(data.gateway_response) : undefined,
  };
}

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim() ?? "";
  if (!secret || !signature) return false;
  const digest = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isLookfinesseMetadata(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false;
  return String(metadata.app ?? "") === "lookfinesse";
}
