import { NextResponse } from "next/server";
import { isGroqReady } from "@/lib/ai/provider";
import { isPaystackConfigured } from "@/lib/paystack/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function present(name: string): boolean {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Liveness + integration flags. Booleans only — never echo secret values.
 */
export async function GET() {
  const integrations = {
    supabase: isSupabaseConfigured(),
    supabaseServiceRole: present("SUPABASE_SERVICE_ROLE_KEY"),
    groq: isGroqReady(),
    paystack: isPaystackConfigured(),
    paystackPublic: present("PAYSTACK_PUBLIC_KEY"),
    resend: present("RESEND_API_KEY"),
    googleMaps: present("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
    cron: present("CRON_SECRET"),
  };

  return NextResponse.json({ ok: true, integrations });
}
